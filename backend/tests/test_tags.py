import pytest
from app import create_app  # Import your Flask app

@pytest.fixture
def client():
    app = create_app(config_type="test")
    app.testing = True
    with app.test_client() as client:
        yield client

def test_tags(client):
    response = client.get('/tags')
    print(f"Test: /tags", flush=True)
    assert response.status_code == 200
    print(f"Status Code: {response.status_code}", flush=True)
    assert 'data' in response.json
    assert isinstance(response.json['data'], list)
