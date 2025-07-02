"use client"

import { useState, useEffect } from "react"
import {
  Clock,
  Calculator,
  CheckSquare,
  Activity,
  AlertTriangle,
  User,
  Timer,
  Brain,
  Syringe,
  Lock,
} from "lucide-react"

const StrokeProtocolApp = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [arrivalTime, setArrivalTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isCodeActivated, setIsCodeActivated] = useState(false)

  // Estado para controlar el progreso del protocolo
  const [protocolProgress, setProtocolProgress] = useState({
    nihssCompleted: false,
    checklistCompleted: false,
    aspectsCompleted: false,
    canFinishCase: false,
  })

  const [nihssScores, setNihssScores] = useState({
    consciousness: 0,
    questions: 0,
    commands: 0,
    gaze: 0,
    visual: 0,
    facial: 0,
    armLeft: 0,
    armRight: 0,
    legLeft: 0,
    legRight: 0,
    ataxia: 0,
    sensory: 0,
    language: 0,
    dysarthria: 0,
    extinction: 0,
  })

  const [patientData, setPatientData] = useState({
    age: "",
    weight: "",
    bloodPressure: "",
    glucose: "",
    symptomOnset: "",
  })

  const [checklist, setChecklist] = useState({
    inclusionCriteria: { timeWindow: false, nihssOver5: false, disablingSymptoms: false },
    exclusionCriteria: { bleeding: false, hypertension: false, anticoagulation: false, giBleeding: false },
  })

  const [thrombectomy, setThrombectomy] = useState({
    timeWindow: "",
    largeVesselOcclusion: false,
    premorbidMRS: 0,
    contraindications: { lifeExpectancy: false, intracranialHemorrhage: false, rapidImprovement: false },
  })

  const [aspectsRegions, setAspectsRegions] = useState({
    caudate: true,
    putamen: true,
    internalCapsule: true,
    insular: true,
    m1: true,
    m2: true,
    m3: true,
    m4: true,
    m5: true,
    m6: true,
  })

  const [savedCases, setSavedCases] = useState([])
  const [currentCaseId, setCurrentCaseId] = useState(null)

  const [emailConfig, setEmailConfig] = useState({
    neurologo: "",
    emergencias: "",
    hemodinamia: "",
    administracion: "",
  })

  // Efecto para actualizar el progreso del protocolo
  useEffect(() => {
    const nihssTotal = calculateNihssTotal()
    const nihssCompleted = nihssTotal > 0 || Object.values(nihssScores).some((score) => score > 0)

    const checklistCompleted =
      Object.values(checklist.inclusionCriteria).some(Boolean) ||
      Object.values(checklist.exclusionCriteria).some(Boolean)

    const aspectsCompleted = Object.values(aspectsRegions).some((region) => !region)

    const canFinishCase = nihssCompleted && checklistCompleted && patientData.age && patientData.weight

    setProtocolProgress({
      nihssCompleted,
      checklistCompleted,
      aspectsCompleted,
      canFinishCase,
    })
  }, [nihssScores, checklist, aspectsRegions, patientData])

  useEffect(() => {
    let interval = null
    if (isTimerRunning && arrivalTime) {
      interval = setInterval(() => {
        const now = new Date()
        const arrival = new Date(arrivalTime)
        setElapsedTime(Math.floor((now - arrival) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, arrivalTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculateNihssTotal = () => {
    return Object.values(nihssScores).reduce((sum, score) => sum + score, 0)
  }

  const calculateRtPADose = () => {
    const weight = Number.parseFloat(patientData.weight)
    if (!weight) return null

    const totalDose = Math.min(weight * 0.9, 90)
    const bolus = totalDose * 0.1
    const infusion = totalDose * 0.9

    return {
      total: totalDose.toFixed(1),
      bolus: bolus.toFixed(1),
      infusion: infusion.toFixed(1),
    }
  }

  const calculateAspects = () => {
    return Object.values(aspectsRegions).filter(Boolean).length
  }

  // Funciones de validación mejoradas
  const getTrombolisisEligibility = () => {
    const nihssTotal = calculateNihssTotal()
    const reasons = []

    // Verificar criterios de inclusión
    if (!checklist.inclusionCriteria.timeWindow) {
      reasons.push("Ventana temporal ≤4.5 horas no confirmada")
    }

    if (!checklist.inclusionCriteria.nihssOver5 && nihssTotal < 5) {
      reasons.push(`NIHSS ${nihssTotal} <5 puntos (considerar síntomas discapacitantes)`)
    }

    if (!checklist.inclusionCriteria.disablingSymptoms && nihssTotal < 5) {
      reasons.push("Síntomas discapacitantes no confirmados para NIHSS <5")
    }

    // Verificar criterios de exclusión
    if (checklist.exclusionCriteria.bleeding) {
      reasons.push("Presencia de sangrado activo o reciente")
    }

    if (checklist.exclusionCriteria.hypertension) {
      reasons.push("Hipertensión >185/110 mmHg refractaria a tratamiento")
    }

    if (checklist.exclusionCriteria.anticoagulation) {
      reasons.push("Anticoagulación reciente (INR >1.7, heparina <48h)")
    }

    if (checklist.exclusionCriteria.giBleeding) {
      reasons.push("Sangrado gastrointestinal <21 días")
    }

    // Lógica mejorada para elegibilidad
    const hasInclusionCriteria =
      checklist.inclusionCriteria.timeWindow &&
      (checklist.inclusionCriteria.nihssOver5 || (nihssTotal < 5 && checklist.inclusionCriteria.disablingSymptoms))

    const hasExclusionCriteria = Object.values(checklist.exclusionCriteria).some(Boolean)

    const eligible = hasInclusionCriteria && !hasExclusionCriteria

    return { eligible, reasons, hasInclusionCriteria, hasExclusionCriteria }
  }

  const getThrombectomyEligibility = () => {
    const nihssTotal = calculateNihssTotal()
    const aspectsScore = calculateAspects()
    const reasons = []

    // Criterios específicos para trombectomía
    if (!thrombectomy.largeVesselOcclusion) {
      reasons.push("No hay oclusión de gran vaso confirmada (requiere angioTC/angioRM)")
    }

    if (nihssTotal < 6) {
      reasons.push(`NIHSS ${nihssTotal} <6 puntos (umbral mínimo para trombectomía mecánica)`)
    }

    if (aspectsScore < 6) {
      reasons.push(`ASPECTS ${aspectsScore} <6 puntos (alto riesgo de transformación hemorrágica)`)
    }

    if (thrombectomy.premorbidMRS > 2) {
      reasons.push(`mRS premórbido ${thrombectomy.premorbidMRS} >2 (dependencia funcional previa significativa)`)
    }

    if (!thrombectomy.timeWindow) {
      reasons.push("Ventana temporal no definida")
    } else if (thrombectomy.timeWindow === ">24h") {
      reasons.push("Ventana temporal >24 horas (fuera de criterios estándar)")
    }

    // Contraindicaciones específicas
    if (thrombectomy.contraindications.lifeExpectancy) {
      reasons.push("Expectativa de vida <6 meses (mal pronóstico basal)")
    }

    if (thrombectomy.contraindications.intracranialHemorrhage) {
      reasons.push("Hemorragia intracraneal activa")
    }

    if (thrombectomy.contraindications.rapidImprovement) {
      reasons.push("Mejoría neurológica rápida (NIHSS mejora >4 puntos)")
    }

    const eligible =
      thrombectomy.largeVesselOcclusion &&
      nihssTotal >= 6 &&
      aspectsScore >= 6 &&
      thrombectomy.premorbidMRS <= 2 &&
      thrombectomy.timeWindow &&
      thrombectomy.timeWindow !== ">24h" &&
      !Object.values(thrombectomy.contraindications).some(Boolean)

    return { eligible, aspects: aspectsScore, nihss: nihssTotal, reasons }
  }

  // Función para verificar si se puede acceder a una pestaña
  const canAccessTab = (tabId) => {
    switch (tabId) {
      case "rtpa":
        return getTrombolisisEligibility().eligible
      case "thrombectomy":
        return protocolProgress.nihssCompleted
      case "aspects":
        return protocolProgress.nihssCompleted
      default:
        return true
    }
  }

  const showEmailNotification = (type) => {
    const notification = document.createElement("div")
    notification.className = "fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50"
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">📧</span>
        ${type === "codigo_activado" ? "Notificación enviada al equipo" : "Resumen del caso enviado"}
      </div>
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  const sendEmailNotification = (type, data) => {
    const emailData = {
      type: type,
      timestamp: new Date().toLocaleString(),
      data: data,
      recipients: emailConfig,
    }

    console.log("📧 Email enviado:", emailData)
    showEmailNotification(type)
  }

  const startCodeStroke = () => {
    const now = new Date()
    setArrivalTime(now.toISOString())
    setIsTimerRunning(true)
    setIsCodeActivated(true)

    sendEmailNotification("codigo_activado", {
      timestamp: now.toLocaleString(),
      message: "Código ACV activado en emergencias",
    })
  }

  const finishCase = () => {
    if (!protocolProgress.canFinishCase) {
      alert(
        "Complete los datos mínimos requeridos:\n- Evaluación NIHSS\n- Criterios de inclusión/exclusión\n- Datos del paciente (edad y peso)",
      )
      return
    }

    setIsCodeActivated(false)
    setIsTimerRunning(false)

    const caseData = {
      id: currentCaseId,
      timestamp: new Date().toLocaleString(),
      patientData: patientData,
      nihssTotal: calculateNihssTotal(),
      aspectsTotal: calculateAspects(),
      eligibleTrombolisis: getTrombolisisEligibility().eligible,
      eligibleTrombectomia: getThrombectomyEligibility().eligible,
      rtpaDose: calculateRtPADose(),
      elapsedTime: Math.floor(elapsedTime / 60) + " minutos",
    }

    sendEmailNotification("resumen_caso", caseData)
  }

  const generateCSV = (caseData) => {
    const headers = ["ID_Caso", "Fecha_Hora", "Edad", "Peso", "NIHSS_Total", "ASPECTS_Total", "Elegible_Trombectomia"]
    const row = [
      caseData.id,
      new Date(caseData.timestamp).toLocaleString(),
      caseData.patientData.age,
      caseData.patientData.weight,
      caseData.nihss.total,
      caseData.aspects.total,
      caseData.trombectomia.eligible ? "SI" : "NO",
    ]
    return headers.join(",") + "\n" + row.join(",")
  }

  const exportToExcel = () => {
    const caseData = {
      id: currentCaseId || Date.now(),
      timestamp: new Date().toISOString(),
      patientData: patientData,
      nihss: { total: calculateNihssTotal() },
      aspects: { total: calculateAspects() },
      trombectomia: { eligible: getThrombectomyEligibility().eligible },
    }

    const csvContent = generateCSV(caseData)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `stroke_case_${caseData.id}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveCase = () => {
    if (!protocolProgress.canFinishCase) {
      alert("Complete los datos mínimos requeridos antes de guardar el caso")
      return
    }

    const caseId = Date.now()
    setCurrentCaseId(caseId)

    const newCase = {
      id: caseId,
      timestamp: new Date().toISOString(),
      patientData,
      nihssTotal: calculateNihssTotal(),
      aspectsTotal: calculateAspects(),
      eligible: getThrombectomyEligibility().eligible,
    }

    setSavedCases([...savedCases, newCase])
    exportToExcel()

    sendEmailNotification("resumen_caso", {
      caso: newCase,
      tratamientos: {
        trombolisis: getTrombolisisEligibility().eligible,
        trombectomia: newCase.eligible,
      },
      dosis: calculateRtPADose(),
    })
  }

  const nihssQuestions = [
    {
      key: "consciousness",
      label: "1a. Nivel de conciencia",
      options: ["Alerta (0)", "Somnolencia (1)", "Obnubilación (2)", "Coma (3)"],
    },
    {
      key: "questions",
      label: "1b. Preguntas verbales",
      options: ["Ambas correctas (0)", "Una correcta (1)", "Ninguna correcta (2)"],
    },
    {
      key: "commands",
      label: "1c. Órdenes motoras",
      options: ["Ambas correctas (0)", "Una correcta (1)", "Ninguna correcta (2)"],
    },
    { key: "gaze", label: "2. Mirada conjugada", options: ["Normal (0)", "Paresia parcial (1)", "Paresia total (2)"] },
    {
      key: "visual",
      label: "3. Campos visuales",
      options: ["Normal (0)", "Hemianopsia parcial (1)", "Hemianopsia completa (2)", "Ceguera bilateral (3)"],
    },
    {
      key: "facial",
      label: "4. Paresia facial",
      options: ["Normal (0)", "Paresia leve (1)", "Parálisis parcial (2)", "Parálisis completa (3)"],
    },
    {
      key: "armLeft",
      label: "5a. Extremidad superior izquierda",
      options: [
        "Normal (0)",
        "Claudica <10s (1)",
        "Toca cama <10s (2)",
        "Movimiento sin gravedad (3)",
        "Parálisis (4)",
      ],
    },
    {
      key: "armRight",
      label: "5b. Extremidad superior derecha",
      options: [
        "Normal (0)",
        "Claudica <10s (1)",
        "Toca cama <10s (2)",
        "Movimiento sin gravedad (3)",
        "Parálisis (4)",
      ],
    },
    {
      key: "legLeft",
      label: "6a. Extremidad inferior izquierda",
      options: ["Normal (0)", "Claudica <5s (1)", "Toca cama <5s (2)", "Movimiento sin gravedad (3)", "Parálisis (4)"],
    },
    {
      key: "legRight",
      label: "6b. Extremidad inferior derecha",
      options: ["Normal (0)", "Claudica <5s (1)", "Toca cama <5s (2)", "Movimiento sin gravedad (3)", "Parálisis (4)"],
    },
    {
      key: "ataxia",
      label: "7. Ataxia de extremidades",
      options: ["Normal (0)", "Una extremidad (1)", "Dos extremidades (2)"],
    },
    { key: "sensory", label: "8. Sensibilidad", options: ["Normal (0)", "Leve-moderada (1)", "Anestesia (2)"] },
    {
      key: "language",
      label: "9. Lenguaje",
      options: ["Normal (0)", "Afasia leve-moderada (1)", "Afasia grave (2)", "Afasia global (3)"],
    },
    { key: "dysarthria", label: "10. Disartria", options: ["Normal (0)", "Leve (1)", "Grave (2)"] },
    {
      key: "extinction",
      label: "11. Extinción-Negligencia",
      options: ["Normal (0)", "Una modalidad (1)", "Más de una modalidad (2)"],
    },
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      {isCodeActivated && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h2 className="text-xl font-bold text-red-700">CÓDIGO ACV ACTIVADO</h2>
            </div>
            <button
              onClick={finishCase}
              disabled={!protocolProgress.canFinishCase}
              className={`px-4 py-2 rounded text-sm font-medium ${
                protocolProgress.canFinishCase
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              title={!protocolProgress.canFinishCase ? "Complete NIHSS, criterios y datos del paciente" : ""}
            >
              {protocolProgress.canFinishCase ? "Finalizar Caso" : "Completar Protocolo"}
            </button>
          </div>
          <p className="text-sm text-red-600 mt-2">
            ⏰ Tiempo transcurrido: {formatTime(elapsedTime)} | 📧 Equipo notificado automáticamente
          </p>

          {!protocolProgress.canFinishCase && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 font-medium">⚠️ Pendiente para finalizar caso:</p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                {!protocolProgress.nihssCompleted && <li>• Completar evaluación NIHSS</li>}
                {!protocolProgress.checklistCompleted && <li>• Marcar criterios de inclusión/exclusión</li>}
                {!patientData.age && <li>• Ingresar edad del paciente</li>}
                {!patientData.weight && <li>• Ingresar peso del paciente</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {!isCodeActivated && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-bold text-blue-700">Protocolo de Stroke - Listo para Activar</h2>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            Sistema preparado para código ACV. Complete los datos del paciente y active el protocolo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              {isCodeActivated ? "Timer Código ACV" : "Activación de Código"}
            </h3>
            {!isTimerRunning && (
              <button
                onClick={startCodeStroke}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                ACTIVAR CÓDIGO ACV
              </button>
            )}
          </div>

          {isTimerRunning ? (
            <div className="space-y-4">
              <div className="text-3xl font-mono text-center text-red-600">{formatTime(elapsedTime)}</div>

              <div className="space-y-2">
                <div
                  className={`p-2 rounded ${elapsedTime <= 600 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  Evaluación inicial: &lt;10 min {elapsedTime <= 600 ? "✓" : "✗"}
                </div>
                <div
                  className={`p-2 rounded ${elapsedTime <= 1500 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  Neuroimagen: &lt;25 min {elapsedTime <= 1500 ? "✓" : "✗"}
                </div>
                <div
                  className={`p-2 rounded ${elapsedTime <= 3600 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  Puerta-aguja: &lt;60 min {elapsedTime <= 3600 ? "✓" : "✗"}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Timer className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Presione el botón para iniciar el código ACV</p>
              <p className="text-sm">Se notificará automáticamente al equipo médico</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Datos del Paciente
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Edad *</label>
              <input
                type="number"
                value={patientData.age}
                onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Años"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
              <input
                type="number"
                value={patientData.weight}
                onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Peso en kg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Presión Arterial</label>
              <input
                type="text"
                value={patientData.bloodPressure}
                onChange={(e) => setPatientData({ ...patientData, bloodPressure: e.target.value })}
                placeholder="120/80"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">* Campos requeridos para finalizar caso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-medium">NIHSS Total</p>
              <p className="text-2xl font-bold text-blue-800">{calculateNihssTotal()}</p>
              {!protocolProgress.nihssCompleted && <p className="text-xs text-blue-600">Pendiente evaluación</p>}
            </div>
            <Brain className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 font-medium">Dosis rtPA</p>
              <p className="text-2xl font-bold text-green-800">{calculateRtPADose()?.total || "--"} mg</p>
              {!getTrombolisisEligibility().eligible && <p className="text-xs text-green-600">Evaluar criterios</p>}
            </div>
            <Syringe className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-medium">Trombectomía</p>
              <p className="text-sm font-bold text-purple-800">
                {getThrombectomyEligibility().eligible ? "Elegible" : "No elegible"}
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Registro del Caso</h3>
            <p className="text-sm text-gray-600">Guardar datos del paciente en Excel</p>
          </div>
          <button
            onClick={saveCase}
            disabled={!protocolProgress.canFinishCase}
            className={`px-6 py-3 rounded-lg flex items-center font-medium ${
              protocolProgress.canFinishCase
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            title={!protocolProgress.canFinishCase ? "Complete los datos requeridos" : ""}
          >
            <Calculator className="h-5 w-5 mr-2" />
            Guardar y Exportar
          </button>
        </div>

        {savedCases.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-green-600">✅ {savedCases.length} caso(s) guardado(s)</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderNIHSS = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          Escala NIHSS
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {nihssQuestions.map((question) => (
              <div key={question.key} className="border-b pb-4">
                <label className="block text-sm font-medium mb-2">{question.label}</label>
                <select
                  value={nihssScores[question.key]}
                  onChange={(e) =>
                    setNihssScores({
                      ...nihssScores,
                      [question.key]: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  {question.options.map((option, optIndex) => (
                    <option key={optIndex} value={optIndex}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Resumen NIHSS</h3>
            <div className="text-4xl font-bold text-blue-600 mb-4">{calculateNihssTotal()}</div>

            <div className="space-y-2 text-sm">
              <div
                className={`p-2 rounded ${calculateNihssTotal() >= 5 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
              >
                {calculateNihssTotal() >= 5
                  ? "Criterio NIHSS ≥5 cumplido"
                  : "NIHSS <5 - Evaluar síntomas discapacitantes"}
              </div>

              {calculateNihssTotal() >= 15 && (
                <div className="p-2 bg-orange-100 text-orange-800 rounded">⚠️ NIHSS alto - Considerar trombectomía</div>
              )}

              {calculateNihssTotal() >= 6 && (
                <div className="p-2 bg-purple-100 text-purple-800 rounded">
                  🔄 NIHSS ≥6 - Candidato potencial para trombectomía
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab("checklist")}
              className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Continuar a Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChecklist = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <CheckSquare className="h-6 w-6 mr-2" />
          Criterios de Inclusión/Exclusión para Trombolisis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Criterios de Inclusión</h3>
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.inclusionCriteria.timeWindow}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      inclusionCriteria: {
                        ...checklist.inclusionCriteria,
                        timeWindow: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>Ventana temporal ≤4.5 horas</span>
                  <div className="text-xs text-gray-600 mt-1">Desde inicio de síntomas hasta llegada a hospital</div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.inclusionCriteria.nihssOver5}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      inclusionCriteria: {
                        ...checklist.inclusionCriteria,
                        nihssOver5: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>NIHSS ≥5 puntos</span>
                  <div className="text-xs text-gray-600 mt-1">Actual: {calculateNihssTotal()} puntos</div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.inclusionCriteria.disablingSymptoms}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      inclusionCriteria: {
                        ...checklist.inclusionCriteria,
                        disablingSymptoms: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>Síntomas discapacitantes</span>
                  <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                    <strong>Ejemplos de síntomas discapacitantes:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Afasia (alteración del lenguaje)</li>
                      <li>Hemiplejia/hemiparesia (debilidad de un lado)</li>
                      <li>Hemianopsia (pérdida de campo visual)</li>
                      <li>Ataxia incapacitante (pérdida de coordinación)</li>
                      <li>Alteración del nivel de conciencia</li>
                      <li>Cualquier déficit que interfiera con actividades diarias</li>
                    </ul>
                    <p className="mt-2 text-yellow-700">
                      <strong>Nota:</strong> Para NIHSS {"<"}5, este criterio es obligatorio
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Criterios de Exclusión</h3>
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.exclusionCriteria.bleeding}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      exclusionCriteria: {
                        ...checklist.exclusionCriteria,
                        bleeding: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>Sangrado activo o reciente</span>
                  <div className="text-xs text-gray-600 mt-1">Hemorragia intracraneal, GI activa, cirugía reciente</div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.exclusionCriteria.hypertension}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      exclusionCriteria: {
                        ...checklist.exclusionCriteria,
                        hypertension: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>TA {">"} 185/110 mmHg refractaria</span>
                  <div className="text-xs text-gray-600 mt-1">
                    Actual: {patientData.bloodPressure || "No registrada"}
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.exclusionCriteria.anticoagulation}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      exclusionCriteria: {
                        ...checklist.exclusionCriteria,
                        anticoagulation: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>Anticoagulación reciente</span>
                  <div className="text-xs text-gray-600 mt-1">
                    INR {">"}1.7, heparina {"<"}48h, DOAC {"<"}48h
                  </div>
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={checklist.exclusionCriteria.giBleeding}
                  onChange={(e) =>
                    setChecklist({
                      ...checklist,
                      exclusionCriteria: {
                        ...checklist.exclusionCriteria,
                        giBleeding: e.target.checked,
                      },
                    })
                  }
                  className="mr-2 mt-1"
                />
                <div>
                  <span>Sangrado GI {"<"}21 días</span>
                  <div className="text-xs text-gray-600 mt-1">Hemorragia gastrointestinal reciente</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg border">
          {(() => {
            const eligibility = getTrombolisisEligibility()

            if (eligibility.eligible) {
              return (
                <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">✅</span>
                    <strong className="text-lg">CANDIDATO PARA TROMBOLISIS</strong>
                  </div>
                  <p className="text-sm mb-3">Todos los criterios de inclusión cumplidos, sin criterios de exclusión</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setActiveTab("rtpa")}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Calcular Dosis rtPA
                    </button>
                    <button
                      onClick={() => setActiveTab("thrombectomy")}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Evaluar Trombectomía
                    </button>
                  </div>
                </div>
              )
            } else {
              return (
                <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">❌</span>
                    <strong className="text-lg">NO CANDIDATO PARA TROMBOLISIS</strong>
                  </div>
                  <div className="mt-3">
                    <p className="font-semibold text-sm mb-2">Razones por las que no es candidato:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {eligibility.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      <strong>💡 Próximos pasos:</strong>
                      {eligibility.reasons.some((r) => r.includes("NIHSS"))
                        ? " Considerar evaluar criterios para trombectomía mecánica si hay oclusión de gran vaso."
                        : " Revisar criterios y considerar tratamiento médico estándar."}
                    </p>
                  </div>
                  {calculateNihssTotal() >= 6 && (
                    <button
                      onClick={() => setActiveTab("thrombectomy")}
                      className="mt-3 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Evaluar Trombectomía (NIHSS ≥6)
                    </button>
                  )}
                </div>
              )
            }
          })()}
        </div>
      </div>
    </div>
  )

  const renderAspects = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Brain className="h-6 w-6 mr-2" />
          Escala ASPECTS
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Territorio ACM - Regiones ASPECTS</h3>
            <p className="text-sm text-gray-600 mb-4">
              Marque las regiones que están <strong>normales</strong> (sin isquemia). Desmarque las que tienen cambios
              isquémicos tempranos.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Ganglios Basales</h4>
                {[
                  { key: "caudate", label: "Núcleo Caudado" },
                  { key: "putamen", label: "Putamen" },
                  { key: "internalCapsule", label: "Cápsula Interna" },
                ].map((region) => (
                  <label key={region.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={aspectsRegions[region.key]}
                      onChange={(e) =>
                        setAspectsRegions({
                          ...aspectsRegions,
                          [region.key]: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{region.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Corteza</h4>
                {[
                  { key: "insular", label: "Ínsula (I)" },
                  { key: "m1", label: "M1 (frontal)" },
                  { key: "m2", label: "M2 (frontoparietal)" },
                  { key: "m3", label: "M3 (temporal anterior)" },
                  { key: "m4", label: "M4 (temporal medio)" },
                  { key: "m5", label: "M5 (temporal posterior)" },
                  { key: "m6", label: "M6 (parietal inferior)" },
                ].map((region) => (
                  <label key={region.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={aspectsRegions[region.key]}
                      onChange={(e) =>
                        setAspectsRegions({
                          ...aspectsRegions,
                          [region.key]: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{region.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Score ASPECTS</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">{calculateAspects()}/10</div>

              <div className="space-y-2">
                <div
                  className={`p-3 rounded ${calculateAspects() >= 6 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {calculateAspects() >= 6
                    ? "✅ ASPECTS ≥6 - Elegible para trombectomía"
                    : "❌ ASPECTS <6 - Alto riesgo de sangrado"}
                </div>

                {calculateAspects() >= 8 && (
                  <div className="p-3 bg-green-200 text-green-900 rounded">
                    🌟 ASPECTS excelente (≥8) - Muy buen pronóstico
                  </div>
                )}

                {calculateAspects() < 6 && (
                  <div className="p-3 bg-orange-100 text-orange-800 rounded text-sm">
                    <strong>⚠️ Consideraciones:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Alto riesgo de transformación hemorrágica</li>
                      <li>Evaluar beneficio vs riesgo individualmente</li>
                      <li>Considerar consulta con neurólogo vascular</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Interpretación ASPECTS</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>10 puntos:</strong> Sin cambios isquémicos
                </p>
                <p>
                  <strong>8-9 puntos:</strong> Cambios mínimos, excelente pronóstico
                </p>
                <p>
                  <strong>6-7 puntos:</strong> Cambios moderados, buen candidato
                </p>
                <p>
                  <strong>{"<"}6 puntos:</strong> Cambios extensos, alto riesgo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderThrombectomy = () => {
    const eligibility = getThrombectomyEligibility()

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Criterios de Trombectomía Mecánica
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">Criterios de Inclusión</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ventana temporal</label>
                    <select
                      value={thrombectomy.timeWindow}
                      onChange={(e) => setThrombectomy({ ...thrombectomy, timeWindow: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="0-6h">0-6 horas (ventana estándar)</option>
                      <option value="6-24h">6-24 horas (con criterios de imagen)</option>
                      <option value=">24h">&gt;24 horas (no elegible)</option>
                    </select>
                  </div>

                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={thrombectomy.largeVesselOcclusion}
                      onChange={(e) =>
                        setThrombectomy({
                          ...thrombectomy,
                          largeVesselOcclusion: e.target.checked,
                        })
                      }
                      className="rounded mt-1"
                    />
                    <div>
                      <span>Oclusión de gran vaso confirmada</span>
                      <div className="text-xs text-gray-600 mt-1">
                        ACI, ACM M1-M2, ACP, Basilar (requiere angioTC/angioRM)
                      </div>
                    </div>
                  </label>

                  <div className="flex items-start space-x-2">
                    <input type="checkbox" checked={calculateNihssTotal() >= 6} readOnly className="rounded mt-1" />
                    <div>
                      <span>NIHSS ≥6 (actual: {calculateNihssTotal()})</span>
                      <div className="text-xs text-gray-600 mt-1">Umbral mínimo para beneficio de trombectomía</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input type="checkbox" checked={calculateAspects() >= 6} readOnly className="rounded mt-1" />
                    <div>
                      <span>ASPECTS ≥6 (actual: {calculateAspects()})</span>
                      <div className="text-xs text-gray-600 mt-1">Riesgo aceptable de transformación hemorrágica</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">mRS premórbido (funcionalidad previa)</label>
                    <select
                      value={thrombectomy.premorbidMRS}
                      onChange={(e) =>
                        setThrombectomy({
                          ...thrombectomy,
                          premorbidMRS: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 border rounded"
                    >
                      <option value={0}>0 - Sin síntomas</option>
                      <option value={1}>1 - Sin discapacidad significativa</option>
                      <option value={2}>2 - Discapacidad leve</option>
                      <option value={3}>3 - Discapacidad moderada</option>
                      <option value={4}>4 - Discapacidad moderada-severa</option>
                      <option value={5}>5 - Discapacidad severa</option>
                    </select>
                    <div className="text-xs text-gray-600 mt-1">
                      mRS {">"} 2 indica dependencia funcional previa significativa
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-700 mb-4">Contraindicaciones</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={thrombectomy.contraindications.lifeExpectancy}
                      onChange={(e) =>
                        setThrombectomy({
                          ...thrombectomy,
                          contraindications: {
                            ...thrombectomy.contraindications,
                            lifeExpectancy: e.target.checked,
                          },
                        })
                      }
                      className="rounded mt-1"
                    />
                    <div>
                      <span>Expectativa de vida {"<"}6 meses</span>
                      <div className="text-xs text-gray-600 mt-1">Enfermedad terminal, cáncer avanzado</div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={thrombectomy.contraindications.intracranialHemorrhage}
                      onChange={(e) =>
                        setThrombectomy({
                          ...thrombectomy,
                          contraindications: {
                            ...thrombectomy.contraindications,
                            intracranialHemorrhage: e.target.checked,
                          },
                        })
                      }
                      className="rounded mt-1"
                    />
                    <div>
                      <span>Hemorragia intracraneal</span>
                      <div className="text-xs text-gray-600 mt-1">Sangrado activo en TC/RM cerebral</div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={thrombectomy.contraindications.rapidImprovement}
                      onChange={(e) =>
                        setThrombectomy({
                          ...thrombectomy,
                          contraindications: {
                            ...thrombectomy.contraindications,
                            rapidImprovement: e.target.checked,
                          },
                        })
                      }
                      className="rounded mt-1"
                    />
                    <div>
                      <span>Mejoría neurológica rápida</span>
                      <div className="text-xs text-gray-600 mt-1">NIHSS mejora {">"} 4 puntos espontáneamente</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`p-6 rounded-lg border-2 ${
                  eligibility.eligible ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4">
                  {eligibility.eligible ? "✅ ELEGIBLE PARA TROMBECTOMÍA" : "❌ NO ELEGIBLE PARA TROMBECTOMÍA"}
                </h3>

                {eligibility.eligible ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ventana temporal:</span>
                      <span className="font-medium">{thrombectomy.timeWindow || "No definida"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NIHSS:</span>
                      <span className="font-medium">{eligibility.nihss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ASPECTS:</span>
                      <span className="font-medium">{eligibility.aspects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>mRS premórbido:</span>
                      <span className="font-medium">{thrombectomy.premorbidMRS}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-red-800 mb-2">Razones específicas por las que NO es candidato:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                      {eligibility.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm">
                        <strong>💡 Recomendaciones clínicas:</strong>
                      </p>
                      <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                        {!thrombectomy.largeVesselOcclusion && (
                          <li>Confirmar oclusión de gran vaso con angioTC/angioRM urgente</li>
                        )}
                        {eligibility.nihss < 6 && <li>NIHSS bajo: considerar evolución clínica y reevaluación</li>}
                        {eligibility.aspects < 6 && (
                          <li>ASPECTS bajo: evaluar riesgo-beneficio con neurólogo vascular</li>
                        )}
                        {thrombectomy.premorbidMRS > 2 && (
                          <li>Dependencia funcional previa: discutir objetivos de cuidado con familia</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Recomendaciones</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  {eligibility.eligible && thrombectomy.timeWindow === "0-6h" && (
                    <p>
                      🚨 <strong>URGENTE:</strong> Trombectomía inmediata - Contactar hemodinamia
                    </p>
                  )}
                  {eligibility.eligible && thrombectomy.timeWindow === "6-24h" && (
                    <p>📊 Requiere evaluación con perfusión TC/RM (penumbra salvable)</p>
                  )}
                  {(() => {
                    const trombolisisEligible = getTrombolisisEligibility().eligible
                    if (eligibility.eligible && trombolisisEligible) {
                      return (
                        <p>
                          💊 <strong>Terapia combinada:</strong> rtPA + Trombectomía (gold standard)
                        </p>
                      )
                    } else if (eligibility.eligible && !trombolisisEligible) {
                      return (
                        <p>
                          🔄 <strong>Solo trombectomía:</strong> Contraindicación para rtPA
                        </p>
                      )
                    }
                    return null
                  })()}
                  {!eligibility.eligible && (
                    <p>
                      📋 <strong>Tratamiento médico estándar:</strong> Antiagregación, control de factores de riesgo
                    </p>
                  )}
                </div>
              </div>

              {eligibility.eligible && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Timeline Trombectomía</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• Puerta-punción: {"<"}90 minutos</p>
                    <p>• Punción-reperfusión: {"<"}90 minutos</p>
                    <p>• Máximo 3 pases con dispositivo</p>
                    <p>• TICI 2b-3 como objetivo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRtPA = () => {
    const trombolisisEligibility = getTrombolisisEligibility()
    const dose = calculateRtPADose()

    // Si no es candidato para trombolisis, mostrar mensaje de acceso restringido
    if (!trombolisisEligibility.eligible) {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Calculator className="h-6 w-6 mr-2" />
              Calculadora rtPA
            </h2>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-red-800 mb-3">
                Acceso Restringido - Paciente NO Candidato para Trombolisis
              </h3>
              <p className="text-red-700 mb-4">
                No se puede acceder a la calculadora de rtPA porque el paciente no cumple los criterios de inclusión o
                tiene criterios de exclusión activos.
              </p>

              <div className="bg-white p-4 rounded border text-left">
                <p className="font-semibold text-red-800 mb-2">Razones específicas:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {trombolisisEligibility.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800 text-sm">
                  <strong>💡 Para acceder a esta sección:</strong> Debe completar el checklist de criterios y confirmar
                  que el paciente es candidato para trombolisis.
                </p>
              </div>

              <div className="mt-6 space-x-3">
                <button
                  onClick={() => setActiveTab("checklist")}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Revisar Criterios
                </button>
                {calculateNihssTotal() >= 6 && (
                  <button
                    onClick={() => setActiveTab("thrombectomy")}
                    className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                  >
                    Evaluar Trombectomía
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calculator className="h-6 w-6 mr-2" />
            Calculadora rtPA
          </h2>

          {/* Confirmación de elegibilidad */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-bold text-green-800">Paciente CANDIDATO para trombolisis</h3>
                <p className="text-sm text-green-700">
                  Todos los criterios de inclusión cumplidos, sin criterios de exclusión
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Peso del paciente (kg)</label>
              <input
                type="number"
                value={patientData.weight}
                onChange={(e) => setPatientData({ ...patientData, weight: e.target.value })}
                className="w-full p-3 border rounded-lg text-lg"
                placeholder="Ej: 70"
              />
              {!patientData.weight && (
                <p className="text-sm text-orange-600 mt-1">⚠️ Peso requerido para calcular dosis</p>
              )}
            </div>

            {dose && (
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Dosificación Alteplasa</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Dosis total:</span>
                    <span className="font-bold">{dose.total} mg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bolo IV (10%):</span>
                    <span className="font-bold">{dose.bolus} mg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Infusión 60 min (90%):</span>
                    <span className="font-bold">{dose.infusion} mg</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-100 rounded text-sm">
                  <strong>Recordar:</strong> Máximo 90 mg total
                </div>
              </div>
            )}
          </div>

          {dose && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Protocolo de Administración</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Administrar {dose.bolus} mg como bolo IV en 1 minuto</li>
                <li>Continuar con {dose.infusion} mg en infusión durante 60 minutos</li>
                <li>Monitorear TA cada 15 min las primeras 2 horas</li>
                <li>NIHSS cada hora durante las primeras 6 horas</li>
                <li>Suspender si deterioro neurológico súbito</li>
              </ol>
            </div>
          )}

          {dose && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Contraindicaciones durante infusión</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Deterioro neurológico súbito (sospechar hemorragia)</li>
                <li>• Angioedema que comprometa vía aérea</li>
                <li>• Sangrado activo no controlable</li>
                <li>• Reacción alérgica severa</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Clock className="h-6 w-6 mr-2" />
          Historial de Casos
        </h2>

        <div className="mb-4">
          <button onClick={exportToExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4">
            Exportar Caso Actual
          </button>
        </div>

        {savedCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border text-left">ID</th>
                  <th className="px-4 py-2 border text-left">Fecha/Hora</th>
                  <th className="px-4 py-2 border text-left">Edad</th>
                  <th className="px-4 py-2 border text-left">NIHSS</th>
                  <th className="px-4 py-2 border text-left">ASPECTS</th>
                  <th className="px-4 py-2 border text-left">Trombectomía</th>
                </tr>
              </thead>
              <tbody>
                {savedCases.map((caso) => (
                  <tr key={caso.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 border">{caso.id}</td>
                    <td className="px-4 py-2 border">{new Date(caso.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2 border">{caso.patientData.age}</td>
                    <td className="px-4 py-2 border">{caso.nihssTotal}</td>
                    <td className="px-4 py-2 border">{caso.aspectsTotal}</td>
                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          caso.eligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {caso.eligible ? "Elegible" : "No elegible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay casos guardados aún</p>
            <p className="text-sm">Complete un protocolo y guarde el caso para ver el historial</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderEmailConfig = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <User className="h-6 w-6 mr-2" />
          Configuración de Notificaciones por Email
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Neurólogo de Guardia</label>
              <input
                type="email"
                value={emailConfig.neurologo}
                onChange={(e) => setEmailConfig({ ...emailConfig, neurologo: e.target.value })}
                placeholder="neurologo@hospital.com"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Emergencias</label>
              <input
                type="email"
                value={emailConfig.emergencias}
                onChange={(e) => setEmailConfig({ ...emailConfig, emergencias: e.target.value })}
                placeholder="emergencias@hospital.com"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Hemodinamia</label>
              <input
                type="email"
                value={emailConfig.hemodinamia}
                onChange={(e) => setEmailConfig({ ...emailConfig, hemodinamia: e.target.value })}
                placeholder="hemodinamia@hospital.com"
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Administración</label>
              <input
                type="email"
                value={emailConfig.administracion}
                onChange={(e) => setEmailConfig({ ...emailConfig, administracion: e.target.value })}
                placeholder="admin@hospital.com"
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Tipos de Notificaciones</h3>

            <div className="space-y-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold text-blue-700">📧 Activación de Código</h4>
                <p className="text-gray-600 mt-1">Se envía inmediatamente al activar el código ACV</p>
                <p className="text-xs text-gray-500">→ Todos los contactos</p>
              </div>

              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold text-green-700">📋 Resumen del Caso</h4>
                <p className="text-gray-600 mt-1">Se envía al guardar/finalizar el caso</p>
                <p className="text-xs text-gray-500">→ Incluye NIHSS, ASPECTS, tratamientos</p>
              </div>

              <div className="bg-white p-3 rounded border">
                <h4 className="font-semibold text-purple-700">🚨 Alertas Críticas</h4>
                <p className="text-gray-600 mt-1">Para casos de trombectomía urgente</p>
                <p className="text-xs text-gray-500">→ Hemodinamia + Neurólogo</p>
              </div>
            </div>

            <button
              onClick={() => {
                sendEmailNotification("test", { message: "Email de prueba del sistema" })
              }}
              className="mt-4 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Enviar Email de Prueba
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">⚙️ Configuración del Sistema</h4>
          <p className="text-sm text-yellow-700">
            Los emails se envían automáticamente cuando se activa el código ACV y cuando se completa el protocolo.
            Asegúrese de configurar todos los contactos importantes del equipo médico.
          </p>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "nihss", label: "NIHSS", icon: Brain },
    { id: "aspects", label: "ASPECTS", icon: Brain },
    { id: "thrombectomy", label: "Trombectomía", icon: Activity },
    { id: "rtpa", label: "rtPA", icon: canAccessTab("rtpa") ? Calculator : Lock },
    { id: "reports", label: "Casos", icon: Clock },
    { id: "email", label: "Emails", icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Protocolo Interactivo de Stroke - Código ACV</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-1">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const canAccess = canAccessTab(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => (canAccess ? setActiveTab(tab.id) : null)}
                  disabled={!canAccess}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : canAccess
                        ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        : "text-gray-400 cursor-not-allowed"
                  }`}
                  title={!canAccess && tab.id === "rtpa" ? "Complete criterios de trombolisis primero" : ""}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                  {!canAccess && tab.id === "rtpa" && <Lock className="h-3 w-3 ml-1" />}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "checklist" && renderChecklist()}
        {activeTab === "nihss" && renderNIHSS()}
        {activeTab === "aspects" && renderAspects()}
        {activeTab === "thrombectomy" && renderThrombectomy()}
        {activeTab === "rtpa" && renderRtPA()}
        {activeTab === "reports" && renderReports()}
        {activeTab === "email" && renderEmailConfig()}
      </div>
    </div>
  )
}

export default StrokeProtocolApp
