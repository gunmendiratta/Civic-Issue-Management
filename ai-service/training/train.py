"""Train a MobileNetV3 transfer-learning classifier on an approved dataset.

Expected layout: data/train/<class>/*.jpg and data/validation/<class>/*.jpg.
This script refuses to run when the dataset is missing instead of fabricating data.
"""
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data")
    parser.add_argument("--output", default="models/civicconnect-mobilenetv3.pt")
    parser.add_argument("--epochs", type=int, default=5)
    args = parser.parse_args()
    import torch
    from torchvision import datasets, models
    from .preprocessing import build_transforms

    train_dir = Path(args.data) / "train"
    validation_dir = Path(args.data) / "validation"
    if not train_dir.exists() or not validation_dir.exists():
        raise SystemExit("Dataset folders are missing. Add a licensed dataset under data/train and data/validation.")
    transform = build_transforms()
    train_set = datasets.ImageFolder(train_dir, transform=transform)
    validation_set = datasets.ImageFolder(validation_dir, transform=transform)
    if train_set.classes != validation_set.classes:
        raise SystemExit("Train and validation classes do not match.")
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    model.classifier[3] = torch.nn.Linear(model.classifier[3].in_features, len(train_set.classes))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    loss_fn = torch.nn.CrossEntropyLoss()
    loader = torch.utils.data.DataLoader(train_set, batch_size=32, shuffle=True)
    model.train()
    for epoch in range(args.epochs):
        for images, labels in loader:
            optimizer.zero_grad()
            loss_fn(model(images.to(device)), labels.to(device)).backward()
            optimizer.step()
        print(f"epoch={epoch + 1} loss={loss.item():.4f}")
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "classes": train_set.classes}, args.output)
    print(f"saved={args.output} classes={train_set.classes}")


if __name__ == "__main__":
    main()