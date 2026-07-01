import cv2
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp
import urllib.request
import os
import math
import time
import sqlite3
import face_recognition

model_path = "/home/virusexe/EDU-TCC/EduFocu/Engine/face_landmarker.task"

if not os.path.exists(model_path):
    url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    print("Baixando modelo...")
    urllib.request.urlretrieve(url, model_path)

# =========================================================================
# FUNÇÃO PARA CARREGAR OS ALUNOS DO BANCO DE DADOS
# =========================================================================


def carregar_alunos_cadastrados():
    print("Carregando alunos do banco de dados...")
    conexao = sqlite3.connect("edufoco.db")
    cursor = conexao.cursor()

    try:
        cursor.execute("SELECT nome, foto_path FROM alunos")
        linhas = cursor.fetchall()
    except sqlite3.OperationalError:
        print("Erro: O banco de dados ou a tabela não existem. Rode o 'criar_banco.py' primeiro.")
        conexao.close()
        return [], []

    nomes_conhecidos = []
    encodings_conhecidos = []

    for nome, foto_path in linhas:
        if os.path.exists(foto_path):
            imagem = face_recognition.load_image_file(foto_path)
            encodings = face_recognition.face_encodings(imagem)
            if encodings:
                encodings_conhecidos.append(encodings[0])
                nomes_conhecidos.append(nome)
                print(f"-> {nome} carregado com sucesso.")
        else:
            print(
                f"Aviso: Foto não encontrada para {nome} no caminho: {foto_path}")

    conexao.close()
    return nomes_conhecidos, encodings_conhecidos


nomes_db, encodings_db = carregar_alunos_cadastrados()

base_options = python.BaseOptions(model_asset_path=model_path)
MAX_ROSTOS = 4
options = vision.FaceLandmarkerOptions(
    base_options=base_options, num_faces=MAX_ROSTOS)

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Erro: não foi possível acessar a webcam.")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

tempo_sem_rosto = 0
tempo_cabeca_inclinada = [0.0] * MAX_ROSTOS
ultimo_frame = time.time()


def calcular_inclinacao(landmarks, w, h):
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
            break

        frame = cv2.resize(frame, (640, 480))
        h, w = frame.shape[:2]
        agora = time.time()
        delta = agora - ultimo_frame
        ultimo_frame = agora

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        results = landmarker.detect(mp_image)

        cv2.rectangle(frame, (0, 0), (w, 40), (30, 30, 30), -1)

        if not results.face_landmarks:
            tempo_sem_rosto += delta
            tempo_cabeca_inclinada = [0.0] * MAX_ROSTOS
            if tempo_sem_rosto >= 2:
                cv2.putText(frame, "Status: AMBIENTE VAZIO", (10, 28),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                cv2.putText(frame, "Status: MONITORANDO...", (10, 28),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        else:
            tempo_sem_rosto = 0
            cv2.putText(frame, f"EduFoco - Monitorando {len(results.face_landmarks)} aluno(s)", (
                10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

            for idx, landmarks in enumerate(results.face_landmarks):
                if idx >= MAX_ROSTOS:
                    break

                lista_x = [int(lm.x * w) for lm in landmarks]
                lista_y = [int(lm.y * h) for lm in landmarks]
                x_min, x_max = max(0, min(lista_x) -
                                   15), min(w, max(lista_x) + 15)
                y_min, y_max = max(0, min(lista_y) -
                                   25), min(h, max(lista_y) + 15)

                # =========================================================================
                # LÓGICA DE RECONHECIMENTO EM TEMPO REAL
                # =========================================================================
                nome_identificado = "Desconhecido"

                if encodings_db:
                    localizacao_rosto = [(y_min, x_max, y_max, x_min)]
                    encoding_atual = face_recognition.face_encodings(
                        rgb, localizacao_rosto)

                    if encoding_atual:
                        id_compara = face_recognition.compare_faces(
                            encodings_db, encoding_atual[0], tolerance=0.6)
                        if True in id_compara:
                            primeiro_match = id_compara.index(True)
                            nome_identificado = nomes_db[primeiro_match]

                angulo, pt_topo, pt_queixo = calcular_inclinacao(
                    landmarks, w, h)

                if abs(angulo) > 20:
                    tempo_cabeca_inclinada[idx] += delta
                else:
                    tempo_cabeca_inclinada[idx] = 0

                status = "ATENTO"
                cor_scanner = (0, 255, 0)

                if tempo_cabeca_inclinada[idx] >= 2:
                    status = "DESATENTO"
                    cor_scanner = (0, 165, 255)

                cv2.rectangle(frame, (x_min, y_min),
                              (x_max, y_max), cor_scanner, 2)
                cv2.rectangle(frame, (x_min, y_min - 35),
                              (x_max, y_min), cor_scanner, -1)

                cv2.putText(frame, f"{nome_identificado} - {status}", (x_min + 5, y_min - 12),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
                cv2.putText(frame, f"Ang: {angulo:.1f} | Temp: {tempo_cabeca_inclinada[idx]:.1f}s", (
                    x_min + 5, y_max + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, cor_scanner, 1, cv2.LINE_AA)

        cv2.imshow("EduFoco - Monitoramento", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
