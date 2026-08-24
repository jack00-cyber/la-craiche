from rest_framework import response, serializers
from datetime import date
from .models import User, enfant, parent, carnet , Paiement
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'password']
        read_only_fields = ['id']

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value
    
    def validate_role(self, value):
        if value not in ['user', 'admin']:
            raise serializers.ValidationError("Role must be either 'user' or 'admin'.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create(
            username=validated_data['username'],
            role=validated_data.get('role', 'user'),
        )
        user.set_password(password)
        user.save()
        return user

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add custom data to response
        data['username'] = self.user.username
        data['role'] = self.user.role
        return data

class EnfantSerializer(serializers.ModelSerializer):
    class Meta:
        model = enfant
        fields = ['id', 'nom', 'prenom', 'date_naissance', 'sexe', 'nb_freres_soeurs', 'maladies', 'remarques', 'type_enfant', 'code_unique']
        read_only_fields = ['id', 'code_unique']

    def create(self, validated_data):
        enfant_instance = enfant(**validated_data)
        enfant_instance.code_unique = enfant_instance.code_unique_generator()
        enfant_instance.save()
        return enfant_instance

    def validate_date_naissance(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_sexe(self, value):
        if value not in ['M', 'F']:
            raise serializers.ValidationError("Sex must be either 'M' (Masculin) or 'F' (Féminin).")
        return value
    def validate_type_enfant(self, value):
        if value not in ['Tps', 'Ps', 'Ms', 'Gsm']:
            raise serializers.ValidationError("Type enfant must be one of: 'Tps', 'Ps', 'Ms', 'Gsm'.")
        return value
    
class ParentSerializer(serializers.ModelSerializer):
    enfants = EnfantSerializer(many=True, read_only=True)

    class Meta:
        model = parent
        fields = ['id', 'nom', 'prenom', 'email', 'telephone', 'enfants', 'credit', 'address', 'profession']
        read_only_fields = ['id']

    def validate_email(self, value):
        if parent.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_telephone(self, value):
        if not value.isdigit() or len(value) < 10:
            raise serializers.ValidationError("Telephone must be a valid number with at least 10 digits.")
        return value

    def validate_credit(self, value):
        if value < 0:
            raise serializers.ValidationError("Credit cannot be negative.")
        return value

class CarnetSerializer(serializers.ModelSerializer):
    class Meta:
        model = carnet
        fields = ['id', 'parent', 'annee', 'nb_enfants']
        read_only_fields = ['id']
    
    def create(self, validated_data):

        carnet_obj = carnet.objects.create(**validated_data)

        for i in range(1, 11):  # Assuming 10 tranches
            Paiement.objects.create(
                carnet=carnet_obj,
                numero_tranche=i,
                montant=100.00,  # Default amount, can be adjusted
                status='unpaid'
            )
        return carnet_obj
    
    def validate_annee(self, value):
        current_year = date.today().year
        if value < 2000 or value > current_year:
            raise serializers.ValidationError(f"Year must be between 2000 and {current_year}.")
        return value

    def validate_nb_enfants(self, value):
        if value < 0:
            raise serializers.ValidationError("Number of children cannot be negative.")
        return value

    def validate_parent(self, value):
        if not parent.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Parent does not exist.")
        else:
            if carnet.objects.filter(parent=value, annee=self.initial_data.get('annee')).exists():
                raise serializers.ValidationError("Carnet for this parent and year already exists.")
        return value


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'status', 'carnet', 'numero_tranche', 'montant', 'date_paiement']
        read_only_fields = ['id', 'date_paiement']

    def update(self, instance, validated_data):
        # Handle status update
        status_value = validated_data.get('status')
        if status_value:
            instance.status = status_value
            if status_value == 'paid':
                instance.date_paiement = date.today()
        
        # Handle montant update
        montant_value = validated_data.get('montant')
        if montant_value is not None:
            instance.montant = montant_value
        
        instance.save()
        return instance

    def validate_status(self, value):
        if value not in ['paid', 'unpaid']:
            raise serializers.ValidationError("Status must be either 'paid' or 'unpaid'.")
        return value

    def validate_carnet(self, value):
        if not carnet.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Carnet does not exist.")
        return value

    def validate_numero_tranche(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Numero tranche must be between 1 and 10.")
        return value

class CarnetDetailSerializer(serializers.ModelSerializer):
    paiements = PaiementSerializer(many=True, read_only=True)

    class Meta:
        model = carnet
        fields = ['id', 'parent', 'annee', 'nb_enfants', 'paiements']
        read_only_fields = ['id', 'paiements']
    
