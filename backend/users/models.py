from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager

class Role(models.TextChoices):
    ADMIN = 'admin'
    USER = 'user'
    
    
class User(AbstractBaseUser, PermissionsMixin): 
    email       = models.EmailField(unique=True)
    username    = models.CharField(max_length=150, unique=True)
    role        = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']
    
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        
        
    def __str__(self) -> str:
        return f'{self.username}<{self.email}>'

    def is_admin(self) -> bool:
        return self.role == Role.ADMIN    
    