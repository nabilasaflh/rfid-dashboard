using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using UHF;

class Program
{
    static byte comAdr = 255;
    static int portHandle = 0;
    static bool scanning = false;
    static bool readerConnected = false;
    static string lastEpc = "";

    static void Main()
    {
        int result = RWDev.OpenComPort(
            8,
            ref comAdr,
            5,
            ref portHandle
        );

        if (result != 0)
        {
            Console.WriteLine("Gagal membuka COM8. Error: " + result);
            readerConnected = false;
        }
        else
        {
            readerConnected = true;
            Console.WriteLine("RFID Reader terhubung di COM8");
        }

        StartServer();

        while (true)
        {
            if (scanning)
                Scan();

            Thread.Sleep(100);
        }
    }

    static void StartServer()
    {
        HttpListener server = new HttpListener();
        server.Prefixes.Add("http://localhost:5001/");
        server.Start();

        Console.WriteLine("RFID Bridge aktif: http://localhost:5001");

        new Thread(() =>
        {
            while (true)
            {
                var context = server.GetContext();
                var path = context.Request.Url.AbsolutePath;

                string response;

                if (path == "/reader/status")
                {
                    readerConnected = CheckReaderConnection();

                    response = "{\"connected\":" +
                               (readerConnected ? "true" : "false") +
                               "}";
                }
                else if (path == "/reader/start")
                {
                    scanning = true;
                    response = "{\"scanning\":true}";
                }
                else if (path == "/reader/stop")
                {
                    scanning = false;
                    response = "{\"scanning\":false}";
                }
                else if (path == "/reader/last")
                {
                    response = "{\"rfid\":\"" + lastEpc + "\"}";
                }
                else
                {
                    response = "{\"message\":\"RFID Bridge aktif\"}";
                }

                byte[] buffer = Encoding.UTF8.GetBytes(response);

                context.Response.ContentType = "application/json";
                context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

                context.Response.ContentLength64 = buffer.Length;
                context.Response.OutputStream.Write(
                    buffer,
                    0,
                    buffer.Length
                );
                context.Response.Close();
            }
        }).Start();
    }

    static bool CheckReaderConnection()
{
    try
    {
        byte[] versionInfo = new byte[2];

        byte readerType = 0;
        byte trType = 0;
        byte dmaxfre = 0;
        byte dminfre = 0;
        byte powerdBm = 0;
        byte scanTime = 0;
        byte ant = 0;
        byte beepEn = 0;
        byte outputRep = 0;
        byte checkAnt = 0;

        int result = RWDev.GetReaderInformation(
            ref comAdr,
            versionInfo,
            ref readerType,
            ref trType,
            ref dmaxfre,
            ref dminfre,
            ref powerdBm,
            ref scanTime,
            ref ant,
            ref beepEn,
            ref outputRep,
            ref checkAnt,
            portHandle
        );

        if (result == 0)
            return true;

        readerConnected = false;

        try
        {
            RWDev.CloseComPort();
        }
        catch
        {
        }

        portHandle = 0;

        int reconnect = RWDev.OpenComPort(
            8,
            ref comAdr,
            5,
            ref portHandle
        );

        if (reconnect == 0)
        {
            readerConnected = true;
            Console.WriteLine("RFID Reader berhasil reconnect di COM8");
            return true;
        }

        return false;
    }
    catch
    {
        readerConnected = false;
        return false;
    }
}

    static void Scan()
    {
        byte[] epc = new byte[50000];

        byte ant = 0;
        int totalLength = 0;
        int cardNum = 0;

        byte[] maskAdr = new byte[2];
        byte[] maskData = new byte[100];

        int result = RWDev.Inventory_G2(
            ref comAdr,
            4,
            0,
            0,
            maskAdr,
            0,
            maskData,
            0,
            0,
            6,
            0,
            0,
            0x80,
            3,
            1,
            epc,
            ref ant,
            ref totalLength,
            ref cardNum,
            portHandle
        );

        if (cardNum <= 0)
            return;

        int pos = 0;

        for (int i = 0; i < cardNum; i++)
        {
            int epcLength = epc[pos] + 1;

            StringBuilder hex = new StringBuilder();

            for (int j = 1; j < epcLength; j++)
            {
                hex.Append(epc[pos + j].ToString("X2"));
            }

            lastEpc = hex.ToString();

            Console.WriteLine("RFID: " + lastEpc);

            SendToBackend(lastEpc);

            pos += epcLength + 1;
        }
    }

    static void SendToBackend(string rfid)
    {
        try
        {
            using var client = new HttpClient();

            var json = "{\"rfid\":\"" + rfid + "\"}";

            var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

            client.PostAsync(
                "http://localhost:5000/api/scan-xerafy",
                content
            ).Wait();

            Console.WriteLine(
                "RFID dikirim ke backend: " + rfid
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                "Gagal kirim RFID ke backend: " + ex.Message
            );
        }
    }
}