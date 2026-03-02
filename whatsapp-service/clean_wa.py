import os
import shutil
import subprocess

def clean_whatsapp():
    paths = [
        "d:/Drishyamitra/whatsapp-service/.wwebjs_auth",
        "d:/Drishyamitra/whatsapp-service/.wwebjs_cache",
        "d:/Drishyamitra/whatsapp-service/uploads"
    ]
    
    print("Stopping any ghost node/chrome processes...")
    subprocess.run("taskkill /F /IM node.exe /T", shell=True, capture_output=True)
    subprocess.run("taskkill /F /IM chrome.exe /T", shell=True, capture_output=True)
    
    for p in paths:
        if os.path.exists(p):
            print(f"Removing {p}...")
            try:
                shutil.rmtree(p)
            except Exception as e:
                print(f"Failed to remove {p}: {e}")
        else:
            print(f"Path not found: {p}")
            
    print("Cleanup complete.")

if __name__ == "__main__":
    clean_whatsapp()
