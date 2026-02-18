import os
import requests
import logging
from typing import Literal

class SignalSender:
    """
    Отправка сигналов на ngrok.
    Метод: POST | Эндпоинт: /trade/start
    """
    def __init__(self):
        # Твой адрес ngrok
        self.base_url = 'https://traci-unflashy-questingly.ngrok-free.dev'
        self.webhook_url = f"{self.base_url}/trade/start"
        self.target_url = "https://www.mexc.com/ru-RU/futures/SOL_USDT"
        self.enabled = True
        
        logging.info(f"Signal sender initialized. Target: {self.webhook_url}")

    def send_signal(self, position_type: Literal["Long", "Short"], mode: Literal["OPEN", "CLOSE"]):
        if not self.enabled:
            return False
        
        # Строгая структура JSON по твоему запросу
        payload = {
            "settings": {
                "targetUrl": self.target_url,
                "openType": position_type,
                "openPercent": 20,
                "closeType": position_type,
                "closePercent": 100,
                "mode": mode
            }
        }
        
        try:
            logging.info(f"📤 Sending POST to ngrok: {mode} {position_type}")
            response = requests.post(self.webhook_url, json=payload, timeout=20)
            
            if response.status_code in [200, 201]:
                logging.info(f"✅ Signal delivered to ngrok!")
                return True
            else:
                logging.error(f"❌ Ngrok error: {response.status_code}")
                return False
        except Exception as e:
            logging.error(f"❌ Failed to connect to ngrok: {e}")
            return False

    def send_open_long(self): return self.send_signal("Long", "OPEN")
    def send_close_long(self): return self.send_signal("Long", "CLOSE")
    def send_open_short(self): return self.send_signal("Short", "OPEN")
    def send_close_short(self): return self.send_signal("Short", "CLOSE")
