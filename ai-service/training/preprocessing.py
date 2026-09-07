"""Dataset validation and transforms for the future image classifier."""
from pathlib import Path

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def image_files(root: str) -> list[Path]:
    """List supported images without inventing or downloading data."""
    return sorted(path for path in Path(root).rglob("*") if path.suffix.lower() in SUPPORTED_EXTENSIONS)


def build_transforms(image_size: int = 224):
    """Build ImageNet transforms only when torchvision is installed."""
    from torchvision import transforms
    normalize = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    return transforms.Compose([transforms.Resize((image_size, image_size)), transforms.ToTensor(), normalize])