import asyncio
from matplotlib.colors import to_rgb
from bleak import BleakScanner, BleakClient
from bleak.exc import BleakDBusError
from .device import BleLedDevice

async def connect_device(prefix="ELK-BLEDOM", max_attempts=5):
    attempt = 0
    print("Starting device scan...")
    while attempt < max_attempts:
        try:
            print(f"Scanning for devices... (Attempt {attempt + 1}/{max_attempts})")
            devices = await BleakScanner.discover(timeout=5.0)
            print("Found devices:")
            for d in devices:
                print(f"- {d.name} ({d.address})")

            devices = [d for d in devices if d.name and d.name.startswith("ELK")]
            print(f"Found devices with prefix '{prefix}': {devices}")

            if not devices:
                print(f"No device with prefix {prefix} found. Retrying ({attempt + 1}/{max_attempts})...")
                attempt += 1
                await asyncio.sleep(3)
                continue

            target_device = devices[0]
            print(f"Connecting to {target_device.name} ({target_device.address})...")
            client = BleakClient(target_device)
            await client.connect()
            print("Connected successfully.")
            
            device = await BleLedDevice.new(client)
            return device, client

        except BleakDBusError:
            print("DBusError, retrying...")
            attempt += 1
        
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            attempt += 1
                    
        await asyncio.sleep(2)

    print("Max retry attempts reached. Could not connect to device.")
    return None, None
        