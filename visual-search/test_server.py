import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
import numpy as np
import server


class PhotoSearchTests(unittest.TestCase):
    def test_ranks_and_deduplicates_products(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            np.savez(root / 'index.npz', vectors=[[1., 0.], [.9, .1], [0., 1.]], ids=['a', 'a', 'b'], model=server.MODEL)
            with patch.object(server, 'ROOT', root), patch.object(server, 'embedding', return_value=np.array([1., 0.])):
                self.assertEqual(server.find_similar(b'image'), {'ids': ['a', 'b']})

    def test_missing_index_and_large_upload(self):
        client = TestClient(server.app)
        with tempfile.TemporaryDirectory() as directory, patch.object(server, 'ROOT', Path(directory)):
            self.assertEqual(client.post('/visual-search', content=b'image').status_code, 503)
            self.assertEqual(client.post('/visual-search', content=b'x' * 5_000_001).status_code, 413)


if __name__ == '__main__':
    unittest.main()
