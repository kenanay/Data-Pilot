from pydantic import BaseModel, EmailStr
from typing import Optional

# Ortak alanlar (diğer sınıflar için temel)
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

# Yeni kullanıcı oluşturma isteği
class UserCreate(UserBase):
    password: str

# Kullanıcı verisini istemciye dönerken (okuma)
class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 için orm_mode yerine kullanılır

# Kullanıcı güncelleme isteği
class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None

# JWT token modeli
class Token(BaseModel):
    access_token: str
    token_type: str


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True  # pydantic v2 için
