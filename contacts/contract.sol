// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedTrafficAI
 * @dev Gestión autónoma de tráfico por IA con resolución de conflictos
 * 
 * VISIÓN GENERAL DEL SISTEMA:
 * 1. Los nodos de IA se registran como controladores de tráfico autónomos
 * 2. Cada IA analiza el tráfico independientemente y toma decisiones de temporización
 * 3. Blockchain detecta conflictos entre decisiones de IA vecinas
 * 4. La resolución automática de conflictos elige la mejor decisión
 * 5. Las decisiones ganadoras se ejecutan, las otras se cancelan
 * 6. Se monitorea el rendimiento de la IA y se actualiza la reputación
 */
contract DecentralizedTrafficAI {
    
    // ==================== ESTRUCTURAS ====================
    
    struct AIDecision {
        uint256 id;
        address aiNode;
        string intersectionId;
        uint256 currentNSTiming;
        uint256 currentEWTiming;
        uint256 newNSTiming;
        uint256 newEWTiming;
        uint256 confidence; // porcentaje * 100 (ej., 8500 = 85.00%)
        uint256 expectedImprovement; // porcentaje * 100
        uint256 timestamp;
        uint256 executionTime; // cuándo aplicar el cambio
        DecisionStatus status;
        uint256 actualImprovement; // medido después de la ejecución
    }
    
    struct TrafficNode {
        address nodeAddress;
        string intersectionId;
        bool isActive;
        uint256 aiAccuracy; // promedio móvil de la precisión de predicción
        uint256 totalDecisions;
        uint256 successfulDecisions;
        uint256 lastActivity;
        uint256 priority; // mayor prioridad gana conflictos
    }
    
    struct ConflictResolution {
        uint256[] conflictingDecisions;
        uint256 winnerDecisionId;
        string reason;
        uint256 timestamp;
    }
    
    // ==================== ENUMS ====================
    
    enum DecisionStatus { Pending, Scheduled, Executed, Conflicted, Cancelled }
    
    // ==================== VARIABLES DE ESTADO ====================
    
    mapping(uint256 => AIDecision) public decisions;
    mapping(address => TrafficNode) public aiNodes;
    mapping(string => address) public intersectionToNode;
    mapping(string => string[]) public intersectionNeighbors;
    mapping(uint256 => ConflictResolution) public conflicts;
    
    uint256 public decisionCounter;
    uint256 public conflictCounter;
    uint256 public constant MIN_CONFIDENCE = 7000; // 70.00%
    uint256 public constant MIN_IMPROVEMENT = 500; // 5.00%
    uint256 public constant EXECUTION_DELAY = 10; // 10 segundos para verificar conflictos
    uint256 public constant MIN_GREEN_TIME = 15;
    uint256 public constant MAX_CYCLE_TIME = 120;
    
    address public owner;
    
    // ==================== EVENTOS ====================
    
    event AIDecisionMade(
        uint256 indexed decisionId,
        address indexed aiNode,
        string intersectionId,
        uint256 confidence,
        uint256 expectedImprovement
    );
    
    event DecisionExecuted(
        uint256 indexed decisionId,
        string intersectionId,
        uint256 newNSTiming,
        uint256 newEWTiming,
        uint256 actualImprovement
    );
    
    event ConflictDetected(
        uint256 indexed conflictId,
        uint256[] conflictingDecisions,
        uint256 winnerDecisionId
    );
    
    event NodeRegistered(
        address indexed nodeAddress,
        string intersectionId,
        uint256 initialPriority
    );
    
    event AccuracyUpdated(
        address indexed nodeAddress,
        uint256 oldAccuracy,
        uint256 newAccuracy
    );
    
    // ==================== MODIFICADORES ====================
    
    modifier onlyRegisteredAI() {
        require(aiNodes[msg.sender].isActive, unicode"No es un nodo de IA registrado");
        _;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, unicode"Solo el propietario puede llamar a esta función");
        _;
    }
    
    modifier validDecision(uint256 _decisionId) {
        require(_decisionId < decisionCounter, unicode"La decisión no existe");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        decisionCounter = 0;
        conflictCounter = 0;
    }
    
    // ==================== GESTIÓN DE NODOS DE IA ====================
    
    /**
     * @dev Registrar un nuevo nodo de tráfico de IA
     * 
     * PROCESO:
     * 1. El controlador de IA solicita unirse a la red
     * 2. El sistema valida que el ID de intersección esté disponible
     * 3. Crea un nuevo nodo de IA con reputación inicial (50%)
     * 4. Mapea la intersección a la dirección del nodo de IA
     * 5. Emite un evento de registro para transparencia
     */
    function registerAINode(
        string memory _intersectionId,
        uint256 _initialPriority
    ) external {
        require(!aiNodes[msg.sender].isActive, unicode"El nodo de IA ya está registrado");
        require(bytes(_intersectionId).length > 0, unicode"ID de intersección inválido");
        require(intersectionToNode[_intersectionId] == address(0), unicode"La intersección ya tiene un nodo de IA");
        
        // Crear nuevo nodo de IA con parámetros iniciales
        aiNodes[msg.sender] = TrafficNode({
            nodeAddress: msg.sender,
            intersectionId: _intersectionId,
            isActive: true,
            aiAccuracy: 5000, // Comenzar con 50% de precisión asumida
            totalDecisions: 0,
            successfulDecisions: 0,
            lastActivity: block.timestamp,
            priority: _initialPriority
        });
        
        // Mapear intersección a este nodo de IA
        intersectionToNode[_intersectionId] = msg.sender;
        
        emit NodeRegistered(msg.sender, _intersectionId, _initialPriority);
    }
    
    /**
     * @dev Establecer intersecciones vecinas para detección de conflictos
     * 
     * PROCESO:
     * 1. El propietario define qué intersecciones son vecinas
     * 2. Esto determina qué IAs pueden conflictuar entre sí
     * 3. Solo los vecinos pueden crear conflictos de temporización
     * 4. Se utiliza luego para la resolución automática de conflictos
     */
    function setNeighbors(
        string memory _intersectionId, 
        string[] memory _neighbors
    ) external onlyOwner {
        intersectionNeighbors[_intersectionId] = _neighbors;
    }
    
    // ==================== SISTEMA DE DECISIÓN DE IA ====================
    
    /**
     * @dev La IA toma una decisión autónoma de temporización
     * 
     * PROCESO COMPLETO:
     * 1. La IA analiza los patrones de tráfico actuales en su intersección
     * 2. La IA calcula cambios de temporización óptimos usando algoritmos de ML
     * 3. La IA envía la decisión con puntuación de confianza y mejora esperada
     * 4. El sistema valida los parámetros de temporización (verificaciones de seguridad)
     * 5. Crea un registro de decisión con tiempo de ejecución futuro
     * 6. Verifica automáticamente conflictos con decisiones de IA vecinas
     * 7. Si se encuentran conflictos: activa el algoritmo de resolución de conflictos
     * 8. Si no hay conflictos: programa la decisión para ejecución
     * 9. Actualiza estadísticas del nodo de IA y marca de tiempo de actividad
     * 10. Emite evento para transparencia y monitoreo
     */
    function makeAIDecision(
        uint256 _currentNS,
        uint256 _currentEW,
        uint256 _newNS,
        uint256 _newEW,
        uint256 _confidence,
        uint256 _expectedImprovement
    ) external onlyRegisteredAI returns (uint256) {
        // PASO 1: Validar que la decisión de IA cumple requisitos de seguridad
        require(_validateTiming(_newNS, _newEW), unicode"Parámetros de temporización inválidos");
        require(_confidence >= MIN_CONFIDENCE, unicode"Confianza demasiado baja");
        require(_expectedImprovement >= MIN_IMPROVEMENT, unicode"Mejora demasiado pequeña");
        
        // PASO 2: Crear registro de decisión único
        uint256 decisionId = decisionCounter++;
        string memory intersectionId = aiNodes[msg.sender].intersectionId;
        
        // PASO 3: Almacenar información completa de la decisión
        decisions[decisionId] = AIDecision({
            id: decisionId,
            aiNode: msg.sender,
            intersectionId: intersectionId,
            currentNSTiming: _currentNS,
            currentEWTiming: _currentEW,
            newNSTiming: _newNS,
            newEWTiming: _newEW,
            confidence: _confidence,
            expectedImprovement: _expectedImprovement,
            timestamp: block.timestamp,
            executionTime: block.timestamp + EXECUTION_DELAY, // Ejecución retrasada para verificación de conflictos
            status: DecisionStatus.Pending,
            actualImprovement: 0 // Se actualizará después de la ejecución
        });
        
        // PASO 4: Actualizar estadísticas de actividad del nodo de IA
        aiNodes[msg.sender].totalDecisions++;
        aiNodes[msg.sender].lastActivity = block.timestamp;
        
        // PASO 5: Anunciar decisión a la red
        emit AIDecisionMade(
            decisionId,
            msg.sender,
            intersectionId,
            _confidence,
            _expectedImprovement
        );
        
        // PASO 6: Verificar conflictos con IAs vecinas
        _checkConflicts(decisionId);
        
        return decisionId;
    }
    
    /**
     * @dev Ejecutar una decisión de IA programada
     * 
     * PROCESO:
     * 1. Verificar que la decisión ha sido aprobada (ganó cualquier conflicto)
     * 2. Comprobar que ha pasado suficiente tiempo para la resolución de conflictos
     * 3. Cambiar estado a "Ejecutado"
     * 4. Aplicar nueva temporización de semáforos a la intersección
     * 5. Emitir evento de ejecución para sistemas de monitoreo
     * 6. El sistema de tráfico real ahora usaría estas nuevas temporizaciones
     */
    function executeDecision(uint256 _decisionId) external validDecision(_decisionId) {
        AIDecision storage decision = decisions[_decisionId];
        
        // Verificar que la decisión está lista para ejecución
        require(decision.status == DecisionStatus.Scheduled, unicode"Decisión no lista para ejecución");
        require(block.timestamp >= decision.executionTime, unicode"Tiempo de ejecución no alcanzado");
        
        // Marcar como ejecutada
        decision.status = DecisionStatus.Executed;
        
        // Notificar a sistemas externos del cambio de temporización
        emit DecisionExecuted(
            _decisionId,
            decision.intersectionId,
            decision.newNSTiming,
            decision.newEWTiming,
            decision.actualImprovement
        );
    }
    
    /**
     * @dev Actualizar rendimiento real después de la ejecución de la decisión
     * 
     * PROCESO:
     * 1. La IA mide la mejora real del tráfico después de aplicar los cambios
     * 2. Compara la mejora real con la predicción original
     * 3. Actualiza el registro de decisión con resultados reales
     * 4. Calcula la precisión de la IA y actualiza la reputación
     * 5. Mejores predicciones = mayor reputación = gana más conflictos
     */
    function updatePerformance(
        uint256 _decisionId,
        uint256 _actualImprovement
    ) external onlyRegisteredAI validDecision(_decisionId) {
        AIDecision storage decision = decisions[_decisionId];
        require(decision.aiNode == msg.sender, unicode"Solo el creador de la decisión puede actualizar el rendimiento");
        require(decision.status == DecisionStatus.Executed, unicode"Decisión aún no ejecutada");
        
        // Registrar resultados reales
        decision.actualImprovement = _actualImprovement;
        
        // Actualizar reputación de la IA basada en precisión de predicción
        _updateAIAccuracy(msg.sender, decision.expectedImprovement, _actualImprovement);
    }
    
    // ==================== RESOLUCIÓN DE CONFLICTOS ====================
    
    /**
     * @dev Verificar conflictos con decisiones de intersecciones vecinas
     * 
     * PROCESO COMPLETO DE DETECCIÓN DE CONFLICTOS:
     * 1. Obtener lista de intersecciones vecinas para esta IA
     * 2. Verificar si algún vecino tiene decisiones pendientes recientes
     * 3. Buscar decisiones en marco de tiempo similar (conflictos potenciales)
     * 4. Si se encuentran conflictos: recoger todos los IDs de decisiones conflictivas
     * 5. Ejecutar algoritmo de resolución de conflictos para elegir ganador
     * 6. Actualizar todos los estados de decisión (ganador = programado, otros = en conflicto)
     * 7. Si no hay conflictos: programar inmediatamente la decisión para ejecución
     */
    function _checkConflicts(uint256 _newDecisionId) internal {
        AIDecision storage newDecision = decisions[_newDecisionId];
        string[] memory neighbors = intersectionNeighbors[newDecision.intersectionId];
        
        uint256[] memory conflictingDecisions = new uint256[](10); // Máx 10 conflictos
        uint256 conflictCount = 0;
        
        // PASO 1: Verificar cada intersección vecina en busca de conflictos
        for (uint i = 0; i < neighbors.length; i++) {
            address neighborNode = intersectionToNode[neighbors[i]];
            if (neighborNode != address(0)) {
                // Buscar decisiones recientes que podrían conflictuar
                uint256 conflictingId = _findRecentDecision(neighborNode, newDecision.executionTime);
                if (conflictingId != type(uint256).max) {
                    conflictingDecisions[conflictCount] = conflictingId;
                    conflictCount++;
                }
            }
        }
        
        // PASO 2: Manejar conflictos si se encuentran
        if (conflictCount > 0) {
            // Agregar la nueva decisión a los conflictos
            conflictingDecisions[conflictCount] = _newDecisionId;
            conflictCount++;
            
            // PASO 3: Ejecutar algoritmo de resolución de conflictos
            uint256 winnerId = _resolveConflict(conflictingDecisions, conflictCount);
            
            // PASO 4: Aplicar resultados de la resolución
            _applyConflictResolution(conflictingDecisions, conflictCount, winnerId);
        } else {
            // No se encontraron conflictos - programar inmediatamente para ejecución
            newDecision.status = DecisionStatus.Scheduled;
        }
    }
    
    /**
     * @dev Encontrar decisión pendiente reciente de un nodo
     * 
     * PROCESO:
     * 1. Buscar en decisiones recientes de este nodo de IA
     * 2. Buscar decisiones con tiempos de ejecución similares
     * 3. Devolver ID de decisión si existe potencial de conflicto
     * 4. Devolver valor máximo si no se encuentran conflictos
     */
    function _findRecentDecision(
        address _nodeAddress, 
        uint256 _executionTime
    ) internal view returns (uint256) {
        // Búsqueda simple de decisiones recientes (últimas 100 decisiones)
        uint256 searchStart = decisionCounter > 100 ? decisionCounter - 100 : 0;
        
        for (uint256 i = searchStart; i < decisionCounter; i++) {
            AIDecision storage decision = decisions[i];
            if (decision.aiNode == _nodeAddress && 
                decision.status == DecisionStatus.Pending &&
                decision.executionTime <= _executionTime + 60 && // Dentro de 1 minuto
                decision.executionTime >= _executionTime - 60) {
                return i;
            }
        }
        return type(uint256).max; // No se encontró conflicto
    }
    
    /**
     * @dev Resolver conflicto por prioridad de IA y confianza
     * 
     * ALGORITMO DE RESOLUCIÓN DE CONFLICTOS:
     * 1. Para cada decisión conflictiva, calcular puntuación de prioridad
     * 2. Puntuación = (Precisión de IA × Prioridad de Nodo × Confianza de Decisión)
     * 3. Mayor puntuación gana el conflicto
     * 4. Precisión de IA: aprendida del rendimiento pasado
     * 5. Prioridad de Nodo: establecida durante el registro
     * 6. Confianza de Decisión: confianza de la IA en esta decisión específica
     * 7. Esto asegura que las IAs con mejor rendimiento y mayor confianza ganen
     */
    function _resolveConflict(
        uint256[] memory _conflictingDecisions,
        uint256 _count
    ) internal view returns (uint256) {
        uint256 bestDecisionId = _conflictingDecisions[0];
        uint256 highestScore = 0;
        
        // Comparar todas las decisiones conflictivas
        for (uint i = 0; i < _count; i++) {
            uint256 decisionId = _conflictingDecisions[i];
            AIDecision storage decision = decisions[decisionId];
            TrafficNode storage node = aiNodes[decision.aiNode];
            
            // Calcular puntuación de prioridad compuesta
            uint256 score = (node.aiAccuracy * node.priority * decision.confidence) / 1000000;
            
            if (score > highestScore) {
                highestScore = score;
                bestDecisionId = decisionId;
            }
        }
        
        return bestDecisionId;
    }
    
    /**
     * @dev Aplicar resultados de resolución de conflictos
     * 
     * PROCESO:
     * 1. Crear registro permanente de resolución de conflicto
     * 2. Marcar decisión ganadora como "Programada" para ejecución
     * 3. Marcar decisiones perdedoras como "En Conflicto" (canceladas)
     * 4. Almacenar razonamiento para transparencia
     * 5. Emitir evento para monitoreo y auditoría
     */
    function _applyConflictResolution(
        uint256[] memory _conflictingDecisions,
        uint256 _count,
        uint256 _winnerId
    ) internal {
        // Crear registro permanente de conflicto
        uint256 conflictId = conflictCounter++;
        uint256[] memory conflictArray = new uint256[](_count);
        for (uint i = 0; i < _count; i++) {
            conflictArray[i] = _conflictingDecisions[i];
        }
        
        conflicts[conflictId] = ConflictResolution({
            conflictingDecisions: conflictArray,
            winnerDecisionId: _winnerId,
            reason: unicode"Resolución basada en prioridad de IA y confianza",
            timestamp: block.timestamp
        });
        
        // Actualizar todos los estados de decisión
        for (uint i = 0; i < _count; i++) {
            uint256 decisionId = _conflictingDecisions[i];
            if (decisionId == _winnerId) {
                decisions[decisionId].status = DecisionStatus.Scheduled; // Ganador se ejecuta
            } else {
                decisions[decisionId].status = DecisionStatus.Conflicted; // Perdedores son cancelados
            }
        }
        
        emit ConflictDetected(conflictId, conflictArray, _winnerId);
    }
    
    // ==================== SEGUIMIENTO DE RENDIMIENTO DE IA ====================
    
    /**
     * @dev Actualizar precisión de IA basada en predicción vs resultados reales
     * 
     * PROCESO DE APRENDIZAJE:
     * 1. Comparar mejora predicha por IA vs mejora real medida
     * 2. Calcular porcentaje de error de predicción
     * 3. Convertir error a puntuación de precisión (menos error = mayor precisión)
     * 4. Actualizar precisión promedio móvil de la IA (90% historial, 10% nuevo resultado)
     * 5. Seguir predicciones exitosas (dentro del 20% de error)
     * 6. Mayor precisión da a la IA mayor prioridad en futuros conflictos
     * 7. Esto crea incentivo para que las IAs hagan predicciones precisas
     */
    function _updateAIAccuracy(
        address _aiNode,
        uint256 _predicted,
        uint256 _actual
    ) internal {
        TrafficNode storage node = aiNodes[_aiNode];
        uint256 oldAccuracy = node.aiAccuracy;
        
        // Calcular error de predicción (escala 0-10000)
        uint256 error = _predicted > _actual ? _predicted - _actual : _actual - _predicted;
        uint256 maxError = _predicted > _actual ? _predicted : 10000; // Error máximo posible
        uint256 accuracy = maxError > error ? ((maxError - error) * 10000) / maxError : 0;
        
        // Promedio móvil: 90% peso en historial, 10% en nuevo resultado
        node.aiAccuracy = (node.aiAccuracy * 9 + accuracy) / 10;
        
        // Contar como exitoso si la predicción fue razonablemente precisa
        if (error < 2000) { // Menos del 20% de error
            node.successfulDecisions++;
        }
        
        emit AccuracyUpdated(_aiNode, oldAccuracy, node.aiAccuracy);
    }
    
    // ==================== AYUDANTES INTERNOS ====================
    
    /**
     * @dev Validar parámetros de temporización
     * 
     * VERIFICACIONES DE SEGURIDAD:
     * 1. Tiempo mínimo en verde: 15 segundos (requisito de seguridad)
     * 2. Tiempo máximo de ciclo: 120 segundos (evitar demoras excesivas)
     * 3. Incluir tiempo de despeje de 5 segundos en rojo
     * 4. Previene configuraciones de temporización inseguras
     */
    function _validateTiming(uint256 _ns, uint256 _ew) internal pure returns (bool) {
        return _ns >= MIN_GREEN_TIME && 
               _ew >= MIN_GREEN_TIME && 
               (_ns + _ew + 5) <= MAX_CYCLE_TIME;
    }
    
    // ==================== FUNCIONES DE VISUALIZACIÓN ====================
    
    /**
     * @dev Obtener detalles de decisión de IA
     */
    function getDecision(uint256 _decisionId) external view validDecision(_decisionId) 
        returns (AIDecision memory) {
        return decisions[_decisionId];
    }
    
    /**
     * @dev Obtener información del nodo de IA
     */
    function getAINode(address _nodeAddress) external view returns (TrafficNode memory) {
        return aiNodes[_nodeAddress];
    }
    
    /**
     * @dev Obtener detalles de resolución de conflicto
     */
    function getConflict(uint256 _conflictId) external view returns (ConflictResolution memory) {
        return conflicts[_conflictId];
    }
    
    /**
     * @dev Obtener vecinos de una intersección
     */
    function getNeighbors(string memory _intersectionId) external view returns (string[] memory) {
        return intersectionNeighbors[_intersectionId];
    }
    
    /**
     * @dev Obtener nodo de IA por intersección
     */
    function getNodeByIntersection(string memory _intersectionId) external view returns (address) {
        return intersectionToNode[_intersectionId];
    }
    
    /**
     * @dev Verificar si la decisión está lista para ejecución
     */
    function isReadyForExecution(uint256 _decisionId) external view validDecision(_decisionId) 
        returns (bool) {
        AIDecision storage decision = decisions[_decisionId];
        return decision.status == DecisionStatus.Scheduled && 
               block.timestamp >= decision.executionTime;
    }
}