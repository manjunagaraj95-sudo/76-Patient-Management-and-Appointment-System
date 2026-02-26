
import React, { useState, useEffect } from 'react';
import './App.css';

// --- RBAC Configuration ---
const ROLES = {
  'Hospital Admin': {
    canViewDashboard: true,
    canManagePatients: true,
    canManageAppointments: true,
    canEditPatient: true,
    canApproveAppointment: true,
    canViewAuditLogs: true,
    canAccessAdminSettings: true,
  },
  'Doctor': {
    canViewDashboard: true,
    canManagePatients: true, // View and update patient medical history
    canManageAppointments: true, // View, confirm, reschedule appointments
    canEditPatient: true, // For medical history, not registration
    canApproveAppointment: false,
    canViewAuditLogs: true,
    canAccessAdminSettings: false,
  },
  'Nurse': {
    canViewDashboard: true,
    canManagePatients: true, // View and add patient notes
    canManageAppointments: true, // View, assist with scheduling
    canEditPatient: true, // For notes, vital signs
    canApproveAppointment: false,
    canViewAuditLogs: false,
    canAccessAdminSettings: false,
  },
  'Receptionist': {
    canViewDashboard: true,
    canManagePatients: true, // Register new patients, update basic info
    canManageAppointments: true, // Schedule, cancel, reschedule appointments
    canEditPatient: true, // Basic patient info
    canApproveAppointment: false,
    canViewAuditLogs: false,
    canAccessAdminSettings: false,
  },
  'Patient Support Staff': {
    canViewDashboard: false, // Limited dashboard view
    canManagePatients: true, // View patient info, help with queries
    canManageAppointments: true, // View appointments, assist patients
    canEditPatient: false,
    canApproveAppointment: false,
    canViewAuditLogs: false,
    canAccessAdminSettings: false,
  },
};

// --- Sample Data ---
const getStatusStyles = (status) => {
  switch (status) {
    case 'Approved': return 'status-Approved';
    case 'In Progress': return 'status-In-Progress';
    case 'Pending': return 'status-Pending';
    case 'Rejected': return 'status-Rejected';
    case 'Exception': return 'status-Exception';
    default: return '';
  }
};

const SAMPLE_PATIENTS = [
  { id: 'PAT001', name: 'Alice Smith', dob: '1985-03-10', status: 'Approved', doctor: 'Dr. Evans', lastVisit: '2023-10-26', phone: '555-1234', email: 'alice.s@example.com', address: '123 Main St', medicalHistory: 'Hypertension, Type 2 Diabetes. Last check-up: Normal.', relatedRecords: ['APP001', 'APP005'],
    milestones: ['Registered', 'Medical History Submitted', 'Doctor Assigned', 'Active'], currentMilestone: 'Active' },
  { id: 'PAT002', name: 'Bob Johnson', dob: '1992-07-22', status: 'Pending', doctor: 'Dr. Lee', lastVisit: '2024-01-15', phone: '555-5678', email: 'bob.j@example.com', address: '456 Oak Ave', medicalHistory: 'Asthma. First consultation for diagnosis.', relatedRecords: ['APP002'],
    milestones: ['Registered', 'Medical History Submitted', 'Doctor Assigned'], currentMilestone: 'Doctor Assigned' },
  { id: 'PAT003', name: 'Charlie Brown', dob: '1970-11-05', status: 'In Progress', doctor: 'Dr. White', lastVisit: '2024-07-01', phone: '555-8765', email: 'charlie.b@example.com', address: '789 Pine Ln', medicalHistory: 'Ongoing physiotherapy for knee injury.', relatedRecords: ['APP003', 'APP006'],
    milestones: ['Registered', 'Medical History Submitted', 'Doctor Assigned', 'Active'], currentMilestone: 'Active' },
  { id: 'PAT004', name: 'Diana Prince', dob: '1990-01-01', status: 'Rejected', doctor: 'Dr. Jones', lastVisit: 'N/A', phone: '555-4321', email: 'diana.p@example.com', address: '101 Maple Rd', medicalHistory: 'Incomplete registration form.', relatedRecords: [],
    milestones: ['Registered', 'Medical History Submitted'], currentMilestone: 'Medical History Submitted' },
  { id: 'PAT005', name: 'Eve Adams', dob: '1965-04-18', status: 'Exception', doctor: 'Dr. Green', lastVisit: '2023-12-01', phone: '555-9876', email: 'eve.a@example.com', address: '222 Elm St', medicalHistory: 'Requires special medication approval.', relatedRecords: ['APP004'],
    milestones: ['Registered', 'Medical History Submitted', 'Doctor Assigned', 'Active'], currentMilestone: 'Active' },
];

const SAMPLE_APPOINTMENTS = [
  { id: 'APP001', patientId: 'PAT001', patientName: 'Alice Smith', date: '2024-07-20', time: '10:00 AM', doctor: 'Dr. Evans', status: 'Approved', type: 'Check-up', notes: 'Routine check-up, no major concerns.', workflowStage: 'Confirmed', slaStatus: 'On Track',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Confirmed' },
  { id: 'APP002', patientId: 'PAT002', patientName: 'Bob Johnson', date: '2024-07-21', time: '02:30 PM', doctor: 'Dr. Lee', status: 'Pending', type: 'Consultation', notes: 'First consultation for asthma follow-up.', workflowStage: 'Requested', slaStatus: 'Pending SLA Review',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Requested' },
  { id: 'APP003', patientId: 'PAT003', patientName: 'Charlie Brown', date: '2024-07-22', time: '11:00 AM', doctor: 'Dr. White', status: 'In Progress', type: 'Physiotherapy', notes: 'Follow-up session for knee injury.', workflowStage: 'Scheduled', slaStatus: 'On Track',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Scheduled' },
  { id: 'APP004', patientId: 'PAT005', patientName: 'Eve Adams', date: '2024-07-23', time: '09:00 AM', doctor: 'Dr. Green', status: 'Exception', type: 'Medication Review', notes: 'Requires special approval for medication change.', workflowStage: 'Scheduled', slaStatus: 'SLA Breached',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Scheduled' },
  { id: 'APP005', patientId: 'PAT001', patientName: 'Alice Smith', date: '2024-07-24', time: '01:00 PM', doctor: 'Dr. Evans', status: 'Pending', type: 'Blood Test', notes: 'Fasting required.', workflowStage: 'Requested', slaStatus: 'On Track',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Requested' },
  { id: 'APP006', patientId: 'PAT003', patientName: 'Charlie Brown', date: '2024-07-25', time: '04:00 PM', doctor: 'Dr. White', status: 'Approved', type: 'Consultation', notes: 'Pre-surgery discussion.', workflowStage: 'Confirmed', slaStatus: 'On Track',
    milestones: ['Requested', 'Scheduled', 'Confirmed', 'Completed'], currentMilestone: 'Confirmed' },
];

const SAMPLE_AUDIT_LOGS = [
  { id: 1, type: 'Patient Update', recordId: 'PAT001', message: 'Alice Smith\'s medical history updated by Dr. Evans.', timestamp: '2024-07-19 14:30' },
  { id: 2, type: 'Appointment Scheduled', recordId: 'APP002', message: 'Appointment for Bob Johnson scheduled by Receptionist Sarah.', timestamp: '2024-07-19 10:15' },
  { id: 3, type: 'Patient Registered', recordId: 'PAT002', message: 'New patient Bob Johnson registered by Receptionist Sarah.', timestamp: '2024-07-19 10:00' },
  { id: 4, type: 'Appointment Confirmed', recordId: 'APP001', message: 'Appointment APP001 confirmed by System.', timestamp: '2024-07-18 16:00' },
  { id: 5, type: 'Patient Status Change', recordId: 'PAT004', message: 'Patient Diana Prince status changed to Rejected (Incomplete Registration).', timestamp: '2024-07-17 09:00' },
];

const getPatientById = (id) => SAMPLE_PATIENTS.find(p => p.id === id);
const getAppointmentById = (id) => SAMPLE_APPOINTMENTS.find(a => a.id === id);
const getAuditLogsForRecord = (recordId) => SAMPLE_AUDIT_LOGS.filter(log => log.recordId === recordId);

// --- Reusable Components ---

const Icon = ({ name, className = '' }) => <span className={`icon icon-${name} ${className}`}></span>;

const Breadcrumbs = ({ paths, setView }) => (
  <nav className="breadcrumbs" aria-label="breadcrumb">
    {paths.map((path, index) => (
      <React.Fragment key={path.label}>
        {index > 0 && <Icon name="chevron-right" />}
        {path.onClick ? (
          <a href="#" onClick={(e) => { e.preventDefault(); setView(path.onClick); }}>
            {path.label}
          </a>
        ) : (
          <span>{path.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

const Card = ({ children, onClick, status, className = '' }) => {
  const statusClass = status ? getStatusStyles(status) + ' status-card-border' : '';
  return (
    <div className={`card ${statusClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

const EmptyState = ({ title, description, buttonText, onAction }) => (
  <div className="empty-state">
    <img src="https://via.placeholder.com/120/F1F5F9/94a3b8?text=No+Data" alt="No Data" />
    <h3>{title}</h3>
    <p>{description}</p>
    {buttonText && onAction && <button onClick={onAction}>{buttonText}</button>}
  </div>
);

const MilestoneTracker = ({ milestones, currentMilestone }) => {
  const currentIndex = milestones.indexOf(currentMilestone);
  return (
    <div className="milestone-tracker">
      {milestones.map((milestone, index) => (
        <div key={milestone} className="milestone-stage">
          <div className={`milestone-circle ${index <= currentIndex ? 'completed' : ''} ${index === currentIndex ? 'current' : ''}`}>
            {index + 1}
          </div>
          <span className={`milestone-label ${index === currentIndex ? 'current' : ''}`}>
            {milestone}
          </span>
        </div>
      ))}
    </div>
  );
};

const AuditFeed = ({ logs, userPermissions }) => {
  if (!userPermissions?.canViewAuditLogs) {
    return (
      <div className="card">
        <h3>Audit Logs</h3>
        <p>You do not have permission to view audit logs.</p>
      </div>
    );
  }
  return (
    <div className="flex-col gap-sm">
      {logs.length > 0 ? logs.map(log => (
        <div key={log.id} className="audit-feed-item">
          <strong>{log.type}:</strong> {log.message} <span>({log.timestamp})</span>
        </div>
      )) : (
        <p className="text-light">No audit log entries for this record.</p>
      )}
    </div>
  );
};

const ChartComponent = ({ type, title, data, options }) => {
  // This is a placeholder. In a real app, you'd use a charting library like Chart.js or D3.
  // We'll simulate a simple SVG for visual representation.
  const renderChart = () => {
    switch (type) {
      case 'Bar':
        return (
          <svg width="100%" height="150" viewBox="0 0 300 150">
            {data.map((item, i) => (
              <rect
                key={i}
                x={i * 60 + 20}
                y={150 - (item.value * 10)}
                width="40"
                height={item.value * 10}
                fill={`var(--color-primary, #3b82f6)`}
                rx="4"
              />
            ))}
          </svg>
        );
      case 'Line':
        return (
          <svg width="100%" height="150" viewBox="0 0 300 150">
            <polyline
              fill="none"
              stroke={`var(--color-primary, #3b82f6)`}
              strokeWidth="3"
              points={data.map((item, i) => `${i * 60 + 40},${150 - (item.value * 10)}`).join(' ')}
            />
          </svg>
        );
      case 'Donut':
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let cumulative = 0;
        const colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']; // Shades of blue
        return (
          <svg width="150" height="150" viewBox="0 0 100 100" className="mx-auto">
            {data.map((item, i) => {
              const startAngle = (cumulative / total) * 360;
              cumulative += item.value;
              const endAngle = (cumulative / total) * 360;
              const x1 = 50 + 40 * Math.cos(Math.PI * (startAngle - 90) / 180);
              const y1 = 50 + 40 * Math.sin(Math.PI * (startAngle - 90) / 180);
              const x2 = 50 + 40 * Math.cos(Math.PI * (endAngle - 90) / 180);
              const y2 = 50 + 40 * Math.sin(Math.PI * (endAngle - 90) / 180);
              const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
              const d = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              return <path key={i} d={d} fill={colors[i % colors.length]} />;
            })}
            {/* Inner circle for donut effect */}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
        );
      case 'Gauge':
        const value = data[0]?.value || 0; // Assuming single value for gauge
        const angle = (value / 100) * 180 - 90; // From -90 (0%) to 90 (100%)
        const x = 50 + 40 * Math.cos(Math.PI * angle / 180);
        const y = 50 + 40 * Math.sin(Math.PI * angle / 180);
        return (
          <svg width="150" height="75" viewBox="0 0 100 50" className="mx-auto">
            <path d="M10 50 A40 40 0 0 1 90 50" stroke="#E2E8F0" strokeWidth="8" fill="none" />
            <path d="M10 50 A40 40 0 0 1 90 50" stroke="#3b82f6" strokeWidth="8" fill="none"
              strokeDasharray={`${value * (2 * Math.PI * 40 / 2) / 100}, ${2 * Math.PI * 40 / 2}`} />
            <circle cx="50" cy="50" r="5" fill="#3b82f6" />
            <line x1="50" y1="50" x2={x} y2={y} stroke="#3b82f6" strokeWidth="2" />
          </svg>
        );
      default:
        return <p>Chart type not supported.</p>;
    }
  };

  return (
    <div className="chart-container">
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h3>
      {renderChart()}
    </div>
  );
};

// --- Screens ---

const DashboardScreen = ({ setView }) => {
  const [liveKpi, setLiveKpi] = useState(false);
  useEffect(() => {
    // Simulate real-time updates for KPIs
    const interval = setInterval(() => {
      setLiveKpi(true);
      setTimeout(() => setLiveKpi(false), 500); // Pulse for 0.5s
    }, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const totalPatients = SAMPLE_PATIENTS.length;
  const totalAppointments = SAMPLE_APPOINTMENTS.length;
  const appointmentsToday = SAMPLE_APPOINTMENTS.filter(a => a.date === new Date().toISOString().slice(0, 10)).length;
  const pendingAppointments = SAMPLE_APPOINTMENTS.filter(a => a.status === 'Pending').length;
  const doctorsAvailable = 15; // Example static data

  const handleCardClick = (screen, params = {}) => {
    setView({ screen, params });
  };

  return (
    <div className="main-content">
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Dashboard</h1>

      <div className="card-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className={`kpi-card ${liveKpi ? 'live-update' : ''}`}>
          <div className="kpi-title">Appointments Today</div>
          <div className="kpi-value">{appointmentsToday}</div>
          <div className="kpi-trend positive"><Icon name="arrow-up" /> 5% vs. yesterday</div>
        </div>
        <div className={`kpi-card ${liveKpi ? 'live-update' : ''}`}>
          <div className="kpi-title">Total Patients</div>
          <div className="kpi-value">{totalPatients}</div>
          <div className="kpi-trend positive"><Icon name="arrow-up" /> 1.2% this month</div>
        </div>
        <div className={`kpi-card ${liveKpi ? 'live-update' : ''}`}>
          <div className="kpi-title">Pending Appointments</div>
          <div className="kpi-value">{pendingAppointments}</div>
          <div className="kpi-trend negative"><Icon name="arrow-down" /> 3 pending approvals</div>
        </div>
        <div className={`kpi-card ${liveKpi ? 'live-update' : ''}`}>
          <div className="kpi-title">Doctors Available</div>
          <div className="kpi-value">{doctorsAvailable}</div>
          <div className="kpi-trend positive"><Icon name="arrow-up" /> All shifts covered</div>
        </div>
      </div>

      <div className="card-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <ChartComponent
          type="Bar"
          title="Patient Registrations by Month"
          data={[{ label: 'Jan', value: 30 }, { label: 'Feb', value: 45 }, { label: 'Mar', value: 50 }, { label: 'Apr', value: 35 }, { label: 'May', value: 60 }]}
        />
        <ChartComponent
          type="Line"
          title="Daily Appointment Volume"
          data={[{ label: 'Mon', value: 15 }, { label: 'Tue', value: 22 }, { label: 'Wed', value: 18 }, { label: 'Thu', value: 25 }, { label: 'Fri', value: 20 }]}
        />
        <ChartComponent
          type="Donut"
          title="Appointment Status Distribution"
          data={[{ label: 'Approved', value: 60 }, { label: 'Pending', value: 25 }, { label: 'Rejected', value: 10 }, { label: 'Exception', value: 5 }]}
        />
        <ChartComponent
          type="Gauge"
          title="SLA Compliance Rate"
          data={[{ value: 85 }]}
        />
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Recent Activities</h2>
      <div className="flex-col gap-sm" style={{ marginBottom: 'var(--spacing-xl)' }}>
        {SAMPLE_AUDIT_LOGS.slice(0, 5).map(log => (
          <div key={log.id} className="audit-feed-item">
            <strong>{log.type}:</strong> {log.message} <span>({log.timestamp})</span>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Urgent & Pending Items</h2>
      <div className="card-grid">
        {SAMPLE_APPOINTMENTS.filter(a => ['Pending', 'Exception'].includes(a.status)).map(appointment => (
          <Card
            key={appointment.id}
            status={appointment.status}
            onClick={() => handleCardClick('APPOINTMENT_DETAIL', { id: appointment.id })}
          >
            <div className="flex-col gap-xs">
              <h3 className="text-lg text-main">{appointment.patientName} - {appointment.type}</h3>
              <p className="text-light">
                <span className="text-semibold">Doctor:</span> {appointment.doctor}
              </p>
              <p className="text-light">
                <span className="text-semibold">Date:</span> {appointment.date} at {appointment.time}
              </p>
              <p className="text-light">
                <span className="text-semibold">Status:</span> {appointment.status}
              </p>
            </div>
          </Card>
        ))}
        {SAMPLE_PATIENTS.filter(p => ['Pending', 'Exception'].includes(p.status)).map(patient => (
          <Card
            key={patient.id}
            status={patient.status}
            onClick={() => handleCardClick('PATIENT_DETAIL', { id: patient.id })}
          >
            <div className="flex-col gap-xs">
              <h3 className="text-lg text-main">{patient.name}</h3>
              <p className="text-light">
                <span className="text-semibold">Status:</span> {patient.status}
              </p>
              <p className="text-light">
                <span className="text-semibold">Reason:</span> {patient.status === 'Pending' ? 'Requires doctor assignment' : 'Special medication approval'}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PatientListScreen = ({ setView }) => {
  const handleCardClick = (patientId) => {
    setView({ screen: 'PATIENT_DETAIL', params: { id: patientId } });
  };

  return (
    <div className="main-content">
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Patient Management</h1>
      {SAMPLE_PATIENTS.length === 0 ? (
        <EmptyState
          title="No Patients Registered"
          description="It looks like there are no patient records yet. Start by registering a new patient!"
          buttonText="Register New Patient"
          onAction={() => alert('Navigate to Patient Registration Form')}
        />
      ) : (
        <div className="card-grid">
          {SAMPLE_PATIENTS.map(patient => (
            <Card
              key={patient.id}
              status={patient.status}
              onClick={() => handleCardClick(patient.id)}
            >
              <h3 className="text-lg text-main">{patient.name} ({patient.id})</h3>
              <p className="text-light"><span className="text-semibold">Doctor:</span> {patient.doctor}</p>
              <p className="text-light"><span className="text-semibold">Last Visit:</span> {patient.lastVisit}</p>
              <p className="text-light"><span className="text-semibold">Status:</span> {patient.status}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const AppointmentListScreen = ({ setView }) => {
  const handleCardClick = (appointmentId) => {
    setView({ screen: 'APPOINTMENT_DETAIL', params: { id: appointmentId } });
  };

  return (
    <div className="main-content">
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Appointment Scheduling</h1>
      {SAMPLE_APPOINTMENTS.length === 0 ? (
        <EmptyState
          title="No Appointments Scheduled"
          description="There are no appointments in the system. Schedule a new one now!"
          buttonText="Schedule New Appointment"
          onAction={() => alert('Navigate to Appointment Scheduling Form')}
        />
      ) : (
        <div className="card-grid">
          {SAMPLE_APPOINTMENTS.map(appointment => (
            <Card
              key={appointment.id}
              status={appointment.status}
              onClick={() => handleCardClick(appointment.id)}
            >
              <h3 className="text-lg text-main">{appointment.patientName} - {appointment.type}</h3>
              <p className="text-light"><span className="text-semibold">Doctor:</span> {appointment.doctor}</p>
              <p className="text-light"><span className="text-semibold">Date:</span> {appointment.date} at {appointment.time}</p>
              <p className="text-light"><span className="text-semibold">Status:</span> {appointment.status}</p>
              <p className="text-light"><span className="text-semibold">SLA:</span> {appointment.slaStatus}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const PatientDetailScreen = ({ setView, params, userPermissions }) => {
  const patient = getPatientById(params?.id);
  const auditLogs = getAuditLogsForRecord(params?.id);
  const relatedAppointments = SAMPLE_APPOINTMENTS.filter(app => app.patientId === patient?.id);

  if (!patient) {
    return (
      <div className="main-content">
        <Breadcrumbs
          paths={[{ label: 'Patients', onClick: { screen: 'PATIENTS' } }, { label: 'Not Found' }]}
          setView={setView}
        />
        <EmptyState
          title="Patient Not Found"
          description="The patient record you are looking for does not exist."
          buttonText="Back to Patient List"
          onAction={() => setView({ screen: 'PATIENTS' })}
        />
      </div>
    );
  }

  const handleEditPatient = () => {
    alert(`Editing patient: ${patient.name}. In a real app, this would open an edit form.`);
  };

  return (
    <div className="main-content">
      <Breadcrumbs
        paths={[
          { label: 'Patients', onClick: { screen: 'PATIENTS' } },
          { label: patient.name },
        ]}
        setView={setView}
      />
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>{patient.name} ({patient.id})</h1>

      <div className="detail-screen-container">
        <div className="detail-main-content">
          <Card className={getStatusStyles(patient.status)} style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">Record Summary</h3>
              {userPermissions?.canEditPatient && (
                <button onClick={handleEditPatient}>
                  <Icon name="edit" /> Edit Patient
                </button>
              )}
            </div>
            <div className="detail-info-grid">
              <div className="info-item"><span className="info-label">Status</span><span className="info-value text-semibold">{patient.status}</span></div>
              <div className="info-item"><span className="info-label">Date of Birth</span><span className="info-value">{patient.dob}</span></div>
              <div className="info-item"><span className="info-label">Primary Doctor</span><span className="info-value">{patient.doctor}</span></div>
              <div className="info-item"><span className="info-label">Last Visit</span><span className="info-value">{patient.lastVisit}</span></div>
              <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{patient.phone}</span></div>
              <div className="info-item"><span className="info-label">Email</span><span className="info-value">{patient.email}</span></div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}><span className="info-label">Address</span><span className="info-value">{patient.address}</span></div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}><span className="info-label">Medical History</span><span className="info-value">{patient.medicalHistory}</span></div>
            </div>
          </Card>

          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">Workflow Progress</h3>
            </div>
            <MilestoneTracker milestones={patient.milestones} currentMilestone={patient.currentMilestone} />
          </Card>

          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">Related Appointments</h3>
              {userPermissions?.canManageAppointments && (
                <button onClick={() => alert('Schedule new appointment for ' + patient.name)}>
                  + Schedule Appointment
                </button>
              )}
            </div>
            {relatedAppointments.length > 0 ? (
              <div className="flex-col gap-sm">
                {relatedAppointments.map(app => (
                  <Card
                    key={app.id}
                    status={app.status}
                    onClick={() => setView({ screen: 'APPOINTMENT_DETAIL', params: { id: app.id } })}
                  >
                    <div className="flex-row justify-between align-center">
                      <div>
                        <h4 className="text-main">{app.type} with {app.doctor}</h4>
                        <p className="text-light">{app.date} at {app.time} - {app.status}</p>
                      </div>
                      <Icon name="chevron-right" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Related Appointments"
                description="This patient has no upcoming or past appointments."
                buttonText={userPermissions?.canManageAppointments ? "Schedule First Appointment" : null}
                onAction={userPermissions?.canManageAppointments ? () => alert('Schedule new appointment for ' + patient.name) : null}
              />
            )}
          </Card>
        </div>

        <div className="detail-sidebar">
          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">News/Audit Feed</h3>
            </div>
            <AuditFeed logs={auditLogs} userPermissions={userPermissions} />
          </Card>
        </div>
      </div>
    </div>
  );
};

const AppointmentDetailScreen = ({ setView, params, userPermissions }) => {
  const appointment = getAppointmentById(params?.id);
  const auditLogs = getAuditLogsForRecord(params?.id);
  const patient = getPatientById(appointment?.patientId);

  if (!appointment) {
    return (
      <div className="main-content">
        <Breadcrumbs
          paths={[{ label: 'Appointments', onClick: { screen: 'APPOINTMENTS' } }, { label: 'Not Found' }]}
          setView={setView}
        />
        <EmptyState
          title="Appointment Not Found"
          description="The appointment record you are looking for does not exist."
          buttonText="Back to Appointment List"
          onAction={() => setView({ screen: 'APPOINTMENTS' })}
        />
      </div>
    );
  }

  const handleApprove = () => alert(`Appointment ${appointment.id} approved!`);
  const handleReject = () => alert(`Appointment ${appointment.id} rejected!`);
  const handleEdit = () => alert(`Editing appointment: ${appointment.id}.`);

  return (
    <div className="main-content">
      <Breadcrumbs
        paths={[
          { label: 'Appointments', onClick: { screen: 'APPOINTMENTS' } },
          { label: `${appointment.patientName} - ${appointment.type}` },
        ]}
        setView={setView}
      />
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Appointment for {appointment.patientName} ({appointment.id})</h1>

      <div className="detail-screen-container">
        <div className="detail-main-content">
          <Card className={getStatusStyles(appointment.status)} style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">Appointment Details</h3>
              <div className="flex-row gap-sm">
                {userPermissions?.canApproveAppointment && appointment.status === 'Pending' && (
                  <button onClick={handleApprove} style={{ backgroundColor: 'var(--status-approved-border)' }}>
                    <Icon name="approve" /> Approve
                  </button>
                )}
                {userPermissions?.canApproveAppointment && appointment.status === 'Pending' && (
                  <button onClick={handleReject} style={{ backgroundColor: 'var(--status-rejected-border)' }}>
                    <Icon name="reject" /> Reject
                  </button>
                )}
                {userPermissions?.canManageAppointments && (
                  <button onClick={handleEdit}>
                    <Icon name="edit" /> Edit
                  </button>
                )}
              </div>
            </div>
            <div className="detail-info-grid">
              <div className="info-item"><span className="info-label">Status</span><span className="info-value text-semibold">{appointment.status}</span></div>
              <div className="info-item"><span className="info-label">Type</span><span className="info-value">{appointment.type}</span></div>
              <div className="info-item"><span className="info-label">Doctor</span><span className="info-value">{appointment.doctor}</span></div>
              <div className="info-item"><span className="info-label">Date & Time</span><span className="info-value">{appointment.date} at {appointment.time}</span></div>
              <div className="info-item"><span className="info-label">SLA Status</span><span className="info-value">{appointment.slaStatus} {appointment.slaStatus === 'SLA Breached' && <span style={{ color: 'var(--status-rejected-border)' }}>(Breached)</span>}</span></div>
              <div className="info-item" style={{ gridColumn: '1 / -1' }}><span className="info-label">Notes</span><span className="info-value">{appointment.notes}</span></div>
            </div>
          </Card>

          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">Workflow Milestones</h3>
            </div>
            <MilestoneTracker milestones={appointment.milestones} currentMilestone={appointment.currentMilestone} />
          </Card>

          {patient && (
            <Card style={{ padding: 'var(--spacing-lg)' }}>
              <div className="detail-section-header">
                <h3 className="text-xl">Patient Information</h3>
              </div>
              <Card onClick={() => setView({ screen: 'PATIENT_DETAIL', params: { id: patient.id } })} style={{ boxShadow: 'none', border: 'none' }}>
                <div className="flex-row justify-between align-center">
                  <div>
                    <h4 className="text-main">{patient.name} ({patient.id})</h4>
                    <p className="text-light">DOB: {patient.dob} | Phone: {patient.phone}</p>
                  </div>
                  <Icon name="chevron-right" />
                </div>
              </Card>
            </Card>
          )}
        </div>

        <div className="detail-sidebar">
          <Card style={{ padding: 'var(--spacing-lg)' }}>
            <div className="detail-section-header">
              <h3 className="text-xl">News/Audit Feed</h3>
            </div>
            <AuditFeed logs={auditLogs} userPermissions={userPermissions} />
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
  const [userRole, setUserRole] = useState('Hospital Admin'); // Default role

  const userPermissions = ROLES[userRole] || {};

  const handleNavigation = (screenName) => {
    setView({ screen: screenName, params: {} });
  };

  const renderScreen = () => {
    switch (view.screen) {
      case 'DASHBOARD':
        return <DashboardScreen setView={setView} />;
      case 'PATIENTS':
        return <PatientListScreen setView={setView} />;
      case 'APPOINTMENTS':
        return <AppointmentListScreen setView={setView} />;
      case 'PATIENT_DETAIL':
        return <PatientDetailScreen setView={setView} params={view.params} userPermissions={userPermissions} />;
      case 'APPOINTMENT_DETAIL':
        return <AppointmentDetailScreen setView={setView} params={view.params} userPermissions={userPermissions} />;
      default:
        return <DashboardScreen setView={setView} />;
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
          <h2 className="header-title">PMAS</h2>
        </div>
        <div
          className={`navbar-item ${view.screen === 'DASHBOARD' ? 'active' : ''}`}
          onClick={() => handleNavigation('DASHBOARD')}
        >
          <Icon name="dashboard" />
          <span>Dashboard</span>
        </div>
        {userPermissions.canManagePatients && (
          <div
            className={`navbar-item ${view.screen.startsWith('PATIENT') ? 'active' : ''}`}
            onClick={() => handleNavigation('PATIENTS')}
          >
            <Icon name="patients" />
            <span>Patients</span>
          </div>
        )}
        {userPermissions.canManageAppointments && (
          <div
            className={`navbar-item ${view.screen.startsWith('APPOINTMENT') ? 'active' : ''}`}
            onClick={() => handleNavigation('APPOINTMENTS')}
          >
            <Icon name="appointments" />
            <span>Appointments</span>
          </div>
        )}
        {userPermissions.canAccessAdminSettings && (
          <div
            className={`navbar-item ${view.screen === 'ADMIN_SETTINGS' ? 'active' : ''}`}
            onClick={() => alert('Admin Settings Page (Not Implemented)')}
          >
            <Icon name="admin" />
            <span>Admin Settings</span>
          </div>
        )}
        <div className="navbar-item" onClick={() => alert('General Settings Page (Not Implemented)')}>
          <Icon name="settings" />
          <span>Settings</span>
        </div>
      </nav>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="header">
          <h1 className="header-title" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-main)' }}>
            Patient Management & Appointment System
          </h1>
          <div className="header-right">
            <input
              type="text"
              placeholder="Global Search..."
              className="search-input"
              style={{ paddingLeft: 'var(--spacing-md)' }}
            />
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              style={{
                padding: 'var(--spacing-xs)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-main)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {Object.keys(ROLES).map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <span className="text-light">Welcome, {userRole}!</span>
          </div>
        </header>
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;