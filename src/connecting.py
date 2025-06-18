import asyncio
from matplotlib.colors import to_rgb
from bleak import BleakScanner, BleakClient
from bleak.exc import BleakDBusError
from .device import BleLedDevice

async def connect_device(prefix="ELK-BLEDOM", max_attempts=5):
    attempt = 0
    while attempt < max_attempts:
        try:
            devices = await BleakScanner.discover(timeout=5.0)
            for a in devices:
                print(a)
            devices = [d for d in devices if d.name and d.name.startswith("ELK")]
            if not devices:
                print(f"No device with prefix {prefix} found. Retrying ({attempt + 1}/{max_attempts})...")
                attempt += 1
                await asyncio.sleep(3)
                continue
            print("connected")
            client = BleakClient(devices[0])
            await client.connect()
            device = await BleLedDevice.new(client)
            return device, client

        except BleakDBusError:
            print("DBusError, retry")
            attempt += 1
        
        except Exception as e:
            print(f"Operation error: {e}")
            attempt += 1
                    
        await asyncio.sleep(2)

    print("Max retry attempts reached. Exiting.")
    return None, None
        