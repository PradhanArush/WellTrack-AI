import os
import json
import numpy as np
from PIL import Image
import io

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .food_data import FOODS

MODEL_DIR    = os.path.join(os.path.dirname(__file__), 'model')
WEIGHTS_PATH = os.path.join(MODEL_DIR, 'food_weights.weights.h5')
LABELS_PATH  = os.path.join(MODEL_DIR, 'class_labels.json')

IMG_SIZE = 224
CONFIDENCE_THRESHOLD = 0.50
NUM_CLASSES = 10

_model  = None
_labels = None


def _build_model():
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Model

    base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))
    base.trainable = False
    x = GlobalAveragePooling2D()(base.output)
    x = Dropout(0.3)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.2)(x)
    out = Dense(NUM_CLASSES, activation='softmax')(x)
    return Model(inputs=base.input, outputs=out)


def _load_model():
    global _model, _labels
    if _model is not None:
        return _model, _labels

    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError("Weights file not found. Expected: foodscan/model/food_weights.weights.h5")
    if not os.path.exists(LABELS_PATH):
        raise FileNotFoundError("Class labels not found. Expected: foodscan/model/class_labels.json")

    _model = _build_model()
    _model.load_weights(WEIGHTS_PATH)

    with open(LABELS_PATH) as f:
        _labels = json.load(f)

    return _model, _labels


def _preprocess(image_file):
    img = Image.open(io.BytesIO(image_file.read())).convert('RGB')
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


class FoodScanAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if not image_file.content_type.startswith('image/'):
            return Response({'error': 'File must be an image.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            model, labels = _load_model()
        except FileNotFoundError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'error': f'Model loading failed: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            img_array = _preprocess(image_file)
        except Exception:
            return Response({'error': 'Could not read image. Try a different file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            predictions = model.predict(img_array, verbose=0)
        except Exception as e:
            return Response({'error': f'Prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        pred_index = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][pred_index])

        if confidence < CONFIDENCE_THRESHOLD:
            return Response(
                {'error': 'Food not recognized with enough confidence. Try a clearer photo.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        food_id = labels.get(str(pred_index))
        if not food_id or food_id not in FOODS:
            return Response(
                {'error': 'Predicted food is not in the supported list.'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        return Response({
            'food_id': food_id,
            'food_name': FOODS[food_id]['name'],
            'confidence': round(confidence, 3),
        })
