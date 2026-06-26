import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp
import urllib.request
import os
import math
import time

model_path = "/home/virusexe/EDU-TCC/EduFocu/Engine/face_landmarker.task"

if not os.path.exists(model_path):
    url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    print("Baixando modelo...")
    urllib.request.urlretrieve(url, model_path)

base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Erro: não foi possível acessar a webcam.")
    exit()

# Resolução da webcam
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

tempo_sem_rosto = 0
tempo_cabeca_inclinada = 0
ultimo_frame = time.time()


def calcular_inclinacao(landmarks, w, h):
    """Calcula o ângulo de inclinação da cabeça usando landmarks do nariz e queixo"""
    topo = landmarks[10]
    queixo = landmarks[152]
    x1, y1 = int(topo.x * w), int(topo.y * h)
    x2, y2 = int(queixo.x * w), int(queixo.y * h)
    angulo = math.degrees(math.atan2(x2 - x1, y2 - y1))
    return angulo, (x1, y1), (x2, y2)


with vision.FaceLandmarker.create_from_options(options) as landmarker:
    while True:
        success, frame = cap.read()

        if not success:
            print("Erro ao capturar frame da webcam.")
            break

        frame = cv2.resize(frame, (640, 480))
        h, w = frame.shape[:2]

        agora = time.time()
        delta = agora - ultimo_frame
        ultimo_frame = agora

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = landmarker.detect(mp_image)

        status = "ATENTO"
        cor_status = (0, 255, 0)

        if not results.face_landmarks:
            tempo_sem_rosto += delta
            tempo_cabeca_inclinada = 0
            if tempo_sem_rosto >= 2:
                status = "ROSTO AUSENTE"
                cor_status = (0, 0, 255)
        else:
            tempo_sem_rosto = 0
            landmarks = results.face_landmarks[0]
            angulo, pt_topo, pt_queixo = calcular_inclinacao(landmarks, w, h)

            cv2.line(frame, pt_topo, pt_queixo, (255, 200, 0), 2)

            if abs(angulo) > 20:
                tempo_cabeca_inclinada += delta
            else:
                tempo_cabeca_inclinada = 0

            if tempo_cabeca_inclinada >= 2:
                status = "CABECA ABAIXADA"
                cor_status = (0, 165, 255)

            cv2.putText(
                frame,
                f"Angulo: {angulo:.1f}",
                (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                1,
            )

        cv2.rectangle(frame, (0, 0), (w, 50), (30, 30, 30), -1)
        cv2.putText(
            frame,
            f"Status: {status}",
            (10, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            cor_status,
            2,
        )
        cv2.putText(
            frame,
            f"Sem rosto: {tempo_sem_rosto:.1f}s",
            (10, 110),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
        )
        cv2.putText(
            frame,
            f"Cab. abaixada: {tempo_cabeca_inclinada:.1f}s",
            (10, 135),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
        )

        cv2.imshow("EduFoco IA", frame)

        if cv2.waitKey(1) & 0xFF == 27:  # ESC para sair
            break

cap.release()
cv2.destroyAllWindows()
