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
    nb_freres_soeurs = models.PositiveIntegerField(default=0)
    maladies = models.TextField(blank=True, null=True)
    remarques = models.TextField(blank=True, null=True)
    type_enfant = models.CharField(max_length=50, choices=[('Tps', 'Tps'), ('Ps', 'Ps'), ('Ms', 'Ms'), ('Gsm', 'Gsm')], default='Tps')
    code_unique = models.CharField(max_length=100, unique=True, blank=True, null=True)


    def code_unique_generator(self):
      last_code = enfant.objects.order_by('-id').first()
      if last_code and last_code.code_unique:
          last_number = int(last_code.code_unique[-4:]) 
          new_number = last_number + 1
      else:
          new_number = 1
      return f"{self.type_enfant}{new_number:04d}"   
    




    def __str__(self):
        return f"{self.nom} {self.prenom}"

class parent(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=15)
    enfants = models.ManyToManyField(enfant, related_name='parents')
    credit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    address = models.CharField(max_length=255, blank=True, null=True)
    profession = models.CharField(max_length=100, blank=True, null=True)
    

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class carnet(models.Model):
    parent = models.ForeignKey(parent, on_delete=models.CASCADE, related_name='carnets')
    annee = models.IntegerField()
    nb_enfants = models.IntegerField()

    def __str__(self):
        return f"Carnet {self.annee} for {self.parent.nom} {self.parent.prenom}"

class Paiement(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')
    carnet = models.ForeignKey(
        carnet,
        on_delete=models.CASCADE,
        related_name='paiements'
    )
    numero_tranche = models.PositiveIntegerField()
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_paiement = models.DateField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['carnet', 'numero_tranche'],
                name='unique_tranche_per_carnet'
            )
        ]