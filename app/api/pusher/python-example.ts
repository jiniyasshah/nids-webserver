// This is not an actual API route, but an example for your Python server
// Save this as a reference for how to send data from your Python server

/*
import requests
import json

def send_packet_to_nextjs(packet_data):
    """
    Send packet data to the Next.js Pusher endpoint
    
    packet_data should be a dictionary with at least:
    {
        "url": "https://example.com/path",
        "method": "GET",
        "headers": {"User-Agent": "...", ...},
        "body": "request body or empty string",
        "client_ip": "192.168.1.1",  # This is the important field for filtering
        "server_ip": ["127", "0", "0", "1"],
        "server_hostname": "example.com"
    }
    """
    url = "https://your-nextjs-app.com/api/pusher"  # Replace with your actual URL
    
    try:
        response = requests.post(
            url,
            json=packet_data,
            headers={"Content-Type": "application/json"}Q
        )
        
        if response.status_code == 200:
            print(f"Successfully sent packet data: {response.json()}")
        else:
            print(f"Error sending packet data: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"Exception sending packet data: {str(e)}")

# Example usage
packet = {
    "url": "https://example.com/api/data",
    "method": "POST",
    "headers": {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json"
    },
    "body": '{"key": "value"}',
    "client_ip": "192.168.1.1",  # This should match an IP in a user's packet list
    "server_ip": ["192", "168", "1", "100"],
    "server_hostname": "api.example.com",
    "timestamp": "2023-06-15T14:32:10.123Z"  # Optional, will be added if missing
}

send_packet_to_nextjs(packet)
*/

// This is just a TypeScript file with a Python example in comments
// It's not meant to be executed as a route
export {};
