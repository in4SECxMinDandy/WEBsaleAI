# ============================================================
# Neural Collaborative Filtering (NCF) — GMF + MLP
# ============================================================

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pickle
from loguru import logger


class NCFDataset(Dataset):
    def __init__(self, interactions: list[tuple[int, int]], n_items: int, negative_samples: int = 4):
        self.interactions = interactions
        self.n_items = n_items
        self.negative_samples = negative_samples
        self.user_positive: dict[int, set[int]] = {}
        for user_id, item_id in interactions:
            if user_id not in self.user_positive:
                self.user_positive[user_id] = set()
            self.user_positive[user_id].add(item_id)

    def __len__(self) -> int:
        return len(self.interactions) * (1 + self.negative_samples)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        pos_idx = idx % len(self.interactions)
        user, item = self.interactions[pos_idx]
        if idx < len(self.interactions):
            return torch.tensor(user), torch.tensor(item), torch.tensor(1.0)
        # Negative sampling
        neg_item = np.random.randint(self.n_items)
        while neg_item in self.user_positive.get(user, set()):
            neg_item = np.random.randint(self.n_items)
        return torch.tensor(user), torch.tensor(neg_item), torch.tensor(0.0)


class NCF(nn.Module):
    def __init__(self, n_users: int, n_items: int, embed_dim: int = 64, dropout: float = 0.2):
        super().__init__()
        # GMF path
        self.gmf_user = nn.Embedding(n_users, embed_dim)
        self.gmf_item = nn.Embedding(n_items, embed_dim)
        # MLP path
        self.mlp_user = nn.Embedding(n_users, embed_dim)
        self.mlp_item = nn.Embedding(n_items, embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim * 2, 256), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(256, 128), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(128, 64), nn.ReLU(),
        )
        # Final prediction
        self.predict_layer = nn.Linear(embed_dim + 64, 1)
        self.sigmoid = nn.Sigmoid()
        self._init_weights()

    def _init_weights(self) -> None:
        for m in self.modules():
            if isinstance(m, nn.Embedding):
                nn.init.normal_(m.weight, std=0.01)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, user_ids: torch.Tensor, item_ids: torch.Tensor) -> torch.Tensor:
        # GMF
        gmf_u = self.gmf_user(user_ids)
        gmf_i = self.gmf_item(item_ids)
        gmf_out = gmf_u * gmf_i
        # MLP
        mlp_u = self.mlp_user(user_ids)
        mlp_i = self.mlp_item(item_ids)
        mlp_out = self.mlp(torch.cat([mlp_u, mlp_i], dim=1))
        # Concat & predict
        concat = torch.cat([gmf_out, mlp_out], dim=1)
        return self.sigmoid(self.predict_layer(concat)).squeeze()


class NCFTrainer:
    def __init__(
        self,
        n_users: int,
        n_items: int,
        embed_dim: int = 64,
        lr: float = 0.001,
        device: str = 'cpu',
    ):
        self.device = torch.device(device)
        self.model = NCF(n_users, n_items, embed_dim).to(self.device)
        self.optimizer = optim.Adam(self.model.parameters(), lr=lr, weight_decay=1e-5)
        self.criterion = nn.BCELoss()
        self.n_users = n_users
        self.n_items = n_items
        self.user_index: dict[str, int] = {}
        self.item_index: dict[str, int] = {}
        self.user_map: dict[int, str] = {}
        self.item_map: dict[int, str] = {}

    def train_epoch(self, dataloader: DataLoader) -> float:
        self.model.train()
        total_loss = 0.0
        for users, items, labels in dataloader:
            users = users.to(self.device)
            items = items.to(self.device)
            labels = labels.to(self.device)
            self.optimizer.zero_grad()
            preds = self.model(users, items)
            loss = self.criterion(preds, labels)
            loss.backward()
            self.optimizer.step()
            total_loss += loss.item()
        return total_loss / len(dataloader)

    def train(self, interactions: list[tuple[int, int]], epochs: int = 20, batch_size: int = 1024) -> list[float]:
        dataset = NCFDataset(interactions, self.n_items)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
        losses = []
        for epoch in range(epochs):
            loss = self.train_epoch(dataloader)
            losses.append(loss)
            if (epoch + 1) % 5 == 0:
                logger.info(f"NCF Epoch {epoch + 1}/{epochs} — Loss: {loss:.4f}")
        return losses

    def recommend(self, user_id: str, top_n: int = 20) -> list[dict]:
        """Get top-N recommendations for a user."""
        if user_id not in self.user_index:
            return []
        uid = self.user_index[user_id]
        all_items = list(range(self.n_items))
        self.model.eval()
        with torch.no_grad():
            users = torch.tensor([uid] * len(all_items)).to(self.device)
            items = torch.tensor(all_items).to(self.device)
            scores = self.model(users, items).cpu().numpy()
        top_idx = np.argsort(scores)[::-1][:top_n]
        return [
            {'product_id': self.item_map.get(int(i), ''), 'score': float(scores[i])}
            for i in top_idx
            if int(i) in self.item_map
        ]

    def save(self, path: str) -> None:
        state = {
            'model_state': self.model.state_dict(),
            'user_index': self.user_index,
            'item_index': self.item_index,
            'user_map': self.user_map,
            'item_map': self.item_map,
            'n_users': self.n_users,
            'n_items': self.n_items,
        }
        torch.save(state, path)
        logger.info(f"NCF model saved to {path}")

    @classmethod
    def load(cls, path: str, device: str = 'cpu') -> 'NCFTrainer':
        state = torch.load(path, map_location=device)
        trainer = cls(state['n_users'], state['n_items'], device=device)
        trainer.model.load_state_dict(state['model_state'])
        trainer.user_index = state['user_index']
        trainer.item_index = state['item_index']
        trainer.user_map = state['user_map']
        trainer.item_map = state['item_map']
        logger.info(f"NCF model loaded from {path}")
        return trainer
