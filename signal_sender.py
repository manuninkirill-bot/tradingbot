import os
import requests
import logging
from typing import Literal

class SignalSender:
    """
    Отправка торговых сигналов на локальный сервис через ngrok.
    Метод: POST
    Эндпоинт: /trade/start
    """
    
    def __init__(self):
        # Базовый URL ngrok (без /trades в конце)
        self.base_url = 'https://traci-unflashy-questingly.ngrok-free.dev'
        # Полный путь к новому эндпоинту
        self.webhook_url = f"{self.base_url}/trade/start"
        
        # Ссылка на инструмент SOL_USDT на MEXC
        self.target_url = "https://www.mexc.com/ru-RU/futures/SOL_USDT"
        self.enabled = True
        
        logging.info(f"Signal sender initialized. Target URL: {self.webhook_url}")
    
    def send_signal(
        self, 
        position_type: Literal["Long", "Short"],
        mode: Literal["OPEN", "CLOSE"]
    ):
        """
        Отправка JSON вебхука методом POST
        """
        if not self.enabled:
            logging.debug(f"Signal not sent (disabled): {position_type} {mode}")
            return False
        
        # Формируем структуру JSON согласно твоему требованию (через объект settings)
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
        
        headers = {
            "Content-Type": "application/json"
        }
        
        try:
            logging.info(f"📤 Sending POST to {self.webhook_url}")
            logging.info(f"Payload: {payload}")
            
            # Выполняем POST запрос
            response = requests.post(
                self.webhook_url, 
                json=payload, 
                headers=headers,
                timeout=30
            )
            
            if response.status_code in [200, 201, 202]:
                logging.info(f"✅ Signal delivered! Status: {response.status_code}")
                return True
            else:
                logging.error(f"❌ Server error: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            logging.error(f"⏱️ Timeout: Local bot at {self.webhook_url} didn't respond")
            return False
        except Exception as e:
            logging.error(f"❌ Signal error: {e}")
            return False
    
    # Методы-обертки для вызова из основного бота
    def send_open_long(self):
        """Открытие Лонг"""
        return self.send_signal("Long", "OPEN")
    
    def send_close_long(self):
        """Закрытие Лонг"""
        return self.send_signal("Long", "CLOSE")
    
    def send_open_short(self):
        """Открытие Шорт"""
        return self.send_signal("Short", "OPEN")
    
    def send_close_short(self):
        """Закрытие Шорт"""
        return self.send_signal("Short", "CLOSE")
