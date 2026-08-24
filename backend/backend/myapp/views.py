from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.utils import timezone
from .serializers import PaiementSerializer, UserSerializer, MyTokenObtainPairSerializer , EnfantSerializer , ParentSerializer , CarnetSerializer , PaiementSerializer , CarnetDetailSerializer
from .models import User, enfant, parent , carnet , Paiement

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer  # Use your custom serializer
    permission_classes = [AllowAny]

class MyTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer
    permission_classes = [AllowAny]

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully', 
                'refresh': str(refresh), 
                'access': str(refresh.access_token),
                'username': user.username,
                'role': user.role
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]  # User must be authenticated to logout

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()  # Blacklist the refresh token (requires token_blacklist app)
            
            return Response({
                'status': 'success',
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]  # User must be authenticated

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class EnfantViewSet(viewsets.ModelViewSet):
    queryset = enfant.objects.all()
    serializer_class = EnfantSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['type_enfant', 'sexe' , 'code_unique']  # Allow filtering by type_enfant and sexe


class ParentViewSet(viewsets.ModelViewSet):
    queryset = parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['nom', 'prenom']  # Allow filtering by name

    @action(detail=True, methods=['post'], url_path='add-enfant')
    def add_enfant(self, request, pk=None):
        parent_instance = self.get_object()
        enfant_id = request.data.get('enfant_id')

        try:
            enfant_instance = enfant.objects.get(id=enfant_id)
            parent_instance.enfants.add(enfant_instance)
            return Response({'status': 'enfant added'}, status=status.HTTP_200_OK)
        except enfant.DoesNotExist:
            return Response({'error': 'Enfant not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='remove-enfant')
    def remove_enfant(self, request, pk=None):
        parent_instance = self.get_object()
        enfant_id = request.data.get('enfant_id')

        try:
            enfant_instance = enfant.objects.get(id=enfant_id)
            parent_instance.enfants.remove(enfant_instance)
            return Response({'status': 'enfant removed'}, status=status.HTTP_200_OK)
        except enfant.DoesNotExist:
            return Response({'error': 'Enfant not found'}, status=status.HTTP_404_NOT_FOUND)


class carnetViewSet(viewsets.ModelViewSet):
    queryset = carnet.objects.all()
    serializer_class = CarnetSerializer
    permission_classes = [IsAuthenticated]
    filterbackends = [DjangoFilterBackend]

    filterset_fields = ['parent', 'annee']  # Allow filtering by parent and year

class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='update-status-montant')
    def update_status_montant(self, request, pk=None, paiement_pk=None):
        try:
            paiement_instance = Paiement.objects.get(pk=paiement_pk, carnet_id=pk)
        except Paiement.DoesNotExist:
            return Response({'error': 'Paiement not found for this carnet'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        montant_value = request.data.get('montant')

        if status_value not in ['paid', 'unpaid']:
            return Response({'error': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)

        paiement_instance.status = status_value

        if status_value == 'paid':
            paiement_instance.date_paiement = timezone.localdate()

        if montant_value is not None:
            try:
                montant_value = float(montant_value)
                paiement_instance.montant = montant_value
            except ValueError:
                return Response({'error': 'Invalid montant value'}, status=status.HTTP_400_BAD_REQUEST)

        paiement_instance.save()

        return Response(
            {
                'status': f'Paiement status updated to {status_value}',
                'date_paiement': paiement_instance.date_paiement,
                'montant': paiement_instance.montant,
            },
            status=status.HTTP_200_OK,
        )


class CarnetDetailViewSet(viewsets.ModelViewSet):
    queryset = carnet.objects.all()
    serializer_class = CarnetDetailSerializer
    permission_classes = [IsAuthenticated]
 

    

