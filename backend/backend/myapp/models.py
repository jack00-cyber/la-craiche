from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.
class User(AbstractUser):
    role = models.CharField(max_length=10, choices=[('admin', 'Admin'), ('user', 'User')], default='user')

    def __str__(self):
        return self.username

class enfant(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField()
    sexe = models.CharField(max_length=10, choices=[('M', 'Masculin'), ('F', 'Féminin')])
    

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class parent(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=15)
    enfants = models.ManyToManyField(enfant, related_name='parents')
    credit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class paiment(models.Model):
    parent = models.ForeignKey(parent, on_delete=models.CASCADE)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"{self.parent} - {self.montant}"