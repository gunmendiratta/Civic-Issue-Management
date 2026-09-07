"""Evaluate a trained checkpoint; metrics are printed only after a real run."""
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/test")
    parser.add_argument("--checkpoint", required=True)
    args = parser.parse_args()
    import torch
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    from torchvision import datasets, models
    from .preprocessing import build_transforms

    checkpoint = torch.load(args.checkpoint, map_location="cpu")
    classes = checkpoint["classes"]
    dataset = datasets.ImageFolder(Path(args.data), transform=build_transforms())
    if dataset.classes != classes:
        raise SystemExit("Test classes do not match checkpoint classes.")
    model = models.mobilenet_v3_small(weights=None)
    model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(classes))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    loader = torch.utils.data.DataLoader(dataset, batch_size=32)
    actual, predicted = [], []
    with torch.no_grad():
        for images, labels in loader:
            actual.extend(labels.tolist())
            predicted.extend(model(images).argmax(1).tolist())
    print(f"accuracy={accuracy_score(actual, predicted):.4f}")
    print(classification_report(actual, predicted, target_names=classes, zero_division=0))
    print(f"confusion_matrix=\n{confusion_matrix(actual, predicted)}")


if __name__ == "__main__":
    main()