import torch
import cv2
import numpy as np
from PIL import Image
from torchvision import transforms

from TRACER.config import get_config
from TRACER.load import load_model
from TRACER.transform import get_test_augmentation

class TracerModel:
    def __init__(self, arch="5", device="cpu"):
        self.cfg = get_config(int(arch))
        self.transform = get_test_augmentation(self.cfg.img_size)
        self.model = load_model(self.cfg, device=device)
        self.model.eval()
        self.device = device
    
    def process_image(self, image_path):
        try:
            print(f"Processing image: {image_path}")
            # Чтение изображения
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Не удалось загрузить изображение")
            
            print(f"Original image size: {img.shape}")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Сохраняем оригинальные размеры
            original_height, original_width = img.shape[:2]
            
            # Применяем преобразования
            img_t = self.transform(image=img)["image"]
            batch_t = torch.unsqueeze(img_t, 0).to(self.device)
            
            # Предсказание
            with torch.no_grad():
                outputs, edge_mask, ds_map = self.model(batch_t)
            
            # Получаем маску и изменяем размер до оригинального
            output = outputs[0][0].cpu().numpy()
            print(f"Mask size before resize: {output.shape}")
            
            # Ресайз маски до оригинальных размеров
            output = cv2.resize(output, (original_width, original_height))
            print(f"Mask size after resize: {output.shape}")
            
            # Создаем RGBA изображение
            rgba = cv2.cvtColor(img, cv2.COLOR_RGB2RGBA)
            rgba[:, :, 3] = (output * 255).astype('uint8')
            
            return rgba
            
        except Exception as e:
            print(f"Error in process_image: {str(e)}")
            raise