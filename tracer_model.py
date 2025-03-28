import torch
import pickle
import os
import logging
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
from torchvision import transforms

class TracerModel:
    def __init__(self, model_path):
        self.device = torch.device('cpu')  # ← Вот это изменение
        
        self.model_path = str(Path(model_path).resolve())
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f'ОПЯТЬ ФАЙЛ НЕ НАЙДЕН ААААААА: {self.model_path}')
            
        self.model = self._load_model()
        self.transform = transforms.Compose([
            transforms.Resize((640, 640)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        logging.info("ВСЕ ХОРОШО!!!!!!!")

    def _load_model(self):
        try:
            #from TRACER.model.TRACER import TRACER  # <- Это неудачная попытка взять модель из изначальной папки с моделью
            #model = TRACER()


            model = TracerModel("archive/data.pkl")  # <- А это попытка пойти через pkl формат
            model.load_state_dict(torch.load(self.model_path))
            return model.to(self.device).eval()
            
        except Exception as e:
            logging.error(f"Ошибка загрузки: {str(e)}")
            raise RuntimeError('ЧТО-ТО ОПЯТЬ НЕ ТАК ААААААААААА')

    # Так как ничего не работает, нет смысла много функций писать, поэтому вот пока чисто для прозрачного фона
    def process_image(self, image_path):
        img = Image.open(image_path).convert('RGB')  # Это передаем загруженное фото
        img_tensor = self.transform(img).unsqueeze(0).to(self.device) # фото -> тензор
        
        with torch.no_grad(): # мы не обучаем, поэтому градиены не нужны
            mask = self.model(img_tensor).squeeze().cpu().numpy() 
            mask = (mask > 0.5).astype(np.uint8) * 255
        
        # Применяем маску, нужен 4ый альфа-канал, который отвечает за простепень прозрачности пикселей
        img_rgba = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2RGBA)
        img_rgba[:, :, 3] = mask
        
        return img_rgba