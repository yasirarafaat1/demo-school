import React, { useState, useEffect } from "react";
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  getClasses,
  getSessions,
  getStudentClasses,
  assignStudentToClass,
  updateStudentClassAssignment,
} from "../../services/classStudentService";
import { supabase } from "../../services/supabaseService";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  InputGroup,
  Image,
} from "react-bootstrap";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaArrowLeft,
  FaTimes,
  FaSearch,
  FaUpload,
} from "react-icons/fa";
import StudentProfile from "../user/StudentProfile";
import { useNavigate } from "react-router-dom";

const StudentManager = ({ refreshTimestamp, fetchData }) => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [studentClasses, setStudentClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [sortField, setSortField] = useState("student_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterClass, setFilterClass] = useState("");
  const [filterSession, setFilterSession] = useState("");
  const [latestSessionId, setLatestSessionId] = useState(null);
  const [showLatestOnly, setShowLatestOnly] = useState(true);

  // Form states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Full page view states
  const [viewMode, setViewMode] = useState("list"); // 'list', 'addStudent', 'editStudent', 'assignStudent'
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  // Student form data
  const [studentFormData, setStudentFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    mobileNumber: "",
    email: "",
    registrationNumber: "",
    imageUrl: "",
  });

  // Assignment form data
  const [assignmentFormData, setAssignmentFormData] = useState({
    classId: "",
    sessionId: "",
    rollNumber: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [refreshTimestamp]);
  
  // Set latest session after data loads
  useEffect(() => {
    if (sessions.length > 0) {
      const latest = sessions[0]; // Sessions are ordered by created_at desc
      setLatestSessionId(latest.id);
      if (showLatestOnly) {
        setFilterSession(latest.id);
      }
    }
  }, [sessions, showLatestOnly]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, classesData, sessionsData, studentClassesData] =
        await Promise.all([
          getStudents(),
          getClasses(),
          getSessions(),
          getStudentClasses(),
        ]);
      setStudents(studentsData);
      setClasses(classesData);
      setSessions(sessionsData);
      setStudentClasses(studentClassesData);
      setError("");
    } catch (err) {
      setError("Failed to load. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get student assignment by student ID
  const getStudentAssignment = (studentId) => {
    return studentClasses.find((sc) => sc.student_id === studentId);
  };

  // Filter and sort students
  const processedStudents = students
    .filter((student) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchMatch =
          student.student_name.toLowerCase().includes(term) ||
          student.father_name.toLowerCase().includes(term) ||
          student.mother_name.toLowerCase().includes(term) ||
          student.registration_number.toLowerCase().includes(term) ||
          student.mobile_number.includes(term) ||
          student.email.toLowerCase().includes(term);
        
        if (!searchMatch) return false;
      }
      
      // Class filter
      const assignment = getStudentAssignment(student.id);
      if (filterClass && (!assignment || String(assignment.class_id) !== String(filterClass))) {
        return false;
      }
      
      // Session filter
      if (filterSession && (!assignment || String(assignment.session_id) !== String(filterSession))) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case "student_name":
          aValue = a.student_name.toLowerCase();
          bValue = b.student_name.toLowerCase();
          break;
        case "registration_number":
          aValue = a.registration_number || "";
          bValue = b.registration_number || "";
          break;
        case "father_name":
          aValue = a.father_name.toLowerCase();
          bValue = b.father_name.toLowerCase();
          break;
        case "class":
          const aAssignment = getStudentAssignment(a.id);
          const bAssignment = getStudentAssignment(b.id);
          aValue = aAssignment ? getClassNameById(aAssignment.class_id) : "";
          bValue = bAssignment ? getClassNameById(bAssignment.class_id) : "";
          break;
        case "registration_datetime":
          aValue = new Date(a.registration_datetime || 0);
          bValue = new Date(b.registration_datetime || 0);
          break;
        default:
          aValue = a.student_name.toLowerCase();
          bValue = b.student_name.toLowerCase();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  
  // Pagination
  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);
  const paginatedStudents = processedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClass, filterSession, sortField, sortDirection]);

  // Handle student form input changes
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle assignment form input changes
  const handleAssignmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open student form for adding
  const openAddStudentForm = () => {
    setEditingStudent(null);
    setSelectedStudentData(null);
    setStudentFormData({
      studentName: "",
      fatherName: "",
      motherName: "",
      dob: "",
      mobileNumber: "",
      email: "",
      registrationNumber: "",
      imageUrl: "",
    });
    setViewMode("addStudent");
  };

  // Open student form for editing
  const openEditStudentForm = (studentObj) => {
    setEditingStudent(studentObj);
    setSelectedStudentData(studentObj);
    setStudentFormData({
      studentName: studentObj.student_name,
      fatherName: studentObj.father_name,
      motherName: studentObj.mother_name,
      dob: studentObj.date_of_birth,
      mobileNumber: studentObj.mobile_number,
      email: studentObj.email,
      registrationNumber: studentObj.registration_number,
      imageUrl: studentObj.image_url || "",
    });
    setViewMode("editStudent");
  };

  // Close student form
  const closeStudentForm = () => {
    setViewMode("list");
    setEditingStudent(null);
    setSelectedStudentData(null);
    setStudentFormData({
      studentName: "",
      fatherName: "",
      motherName: "",
      dob: "",
      mobileNumber: "",
      email: "",
      registrationNumber: "",
      imageUrl: "",
    });
  };

  // Open assignment form
  const openAssignmentForm = (studentObj) => {
    setAssigningStudent(studentObj);
    setSelectedStudentData(studentObj);

    // Check if student already has an assignment
    const existingAssignment = studentClasses.find(
      (sc) => sc.student_id === studentObj.id
    );
    if (existingAssignment) {
      setAssignmentFormData({
        classId: existingAssignment.class_id,
        sessionId: existingAssignment.session_id,
        rollNumber: existingAssignment.roll_number,
      });
    } else {
      setAssignmentFormData({
        classId: "",
        sessionId: "",
        rollNumber: "",
      });
    }

    setViewMode("assignStudent");
  };

  // Close assignment form
  const closeAssignmentForm = () => {
    setViewMode("list");
    setAssigningStudent(null);
    setSelectedStudentData(null);
    setAssignmentFormData({
      classId: "",
      sessionId: "",
      rollNumber: "",
    });
  };

  // Handle student form submission
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !studentFormData.studentName ||
      !studentFormData.fatherName ||
      !studentFormData.motherName ||
      !studentFormData.dob
    ) {
      setError(
        "Student name, father name, mother name, and date of birth are required."
      );
      return;
    }

    try {
      setLoading(true);
      if (editingStudent) {
        // Update existing student
        await updateStudent(editingStudent.id, {
          studentName: studentFormData.studentName,
          fatherName: studentFormData.fatherName,
          motherName: studentFormData.motherName,
          dob: studentFormData.dob,
          mobileNumber: studentFormData.mobileNumber,
          email: studentFormData.email,
          registrationNumber: studentFormData.registrationNumber,
          imageUrl: studentFormData.imageUrl,
        });
        setSuccess("Student updated successfully!");
      } else {
        // Add new student
        await addStudent({
          studentName: studentFormData.studentName,
          fatherName: studentFormData.fatherName,
          motherName: studentFormData.motherName,
          dob: studentFormData.dob,
          mobileNumber: studentFormData.mobileNumber,
          email: studentFormData.email,
          registrationNumber: studentFormData.registrationNumber,
          imageUrl: studentFormData.imageUrl,
        });
        setSuccess("Student added successfully!");
      }

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      closeStudentForm();
    } catch (err) {
      setError("Failed to save student. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle assignment form submission
  const handleAssignmentFormSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !assignmentFormData.classId ||
      !assignmentFormData.sessionId ||
      !assignmentFormData.rollNumber
    ) {
      setError("Class, session, and roll number are required.");
      return;
    }

    // Validate roll number is 6 digits
    if (!/^\d{6}$/.test(assignmentFormData.rollNumber)) {
      setError("Roll number must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);

      // Check if student already has an assignment
      const existingAssignment = studentClasses.find(
        (sc) =>
          sc.student_id === assigningStudent.id &&
          sc.class_id == assignmentFormData.classId &&
          sc.session_id == assignmentFormData.sessionId
      );

      if (existingAssignment) {
        // Update existing assignment
        await updateStudentClassAssignment(existingAssignment.id, {
          studentId: assigningStudent.id,
          classId: parseInt(assignmentFormData.classId),
          sessionId: parseInt(assignmentFormData.sessionId),
          rollNumber: assignmentFormData.rollNumber,
        });
        setSuccess("Student assignment updated successfully!");
      } else {
        // Add new assignment
        await assignStudentToClass({
          studentId: assigningStudent.id,
          classId: parseInt(assignmentFormData.classId),
          sessionId: parseInt(assignmentFormData.sessionId),
          rollNumber: assignmentFormData.rollNumber,
        });
        setSuccess("Student assigned to class successfully!");
      }

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      closeAssignmentForm();
    } catch (err) {
      setError("Failed to save assignment. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Confirm student deletion
  const confirmDeleteStudent = (studentObj) => {
    setDeletingStudent(studentObj);
  };

  // Cancel student deletion
  const cancelDeleteStudent = () => {
    setDeletingStudent(null);
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    try {
      setLoading(true);
      await deleteStudent(deletingStudent.id);
      setSuccess("Student deleted successfully!");

      // Refresh data
      await loadData();
      if (fetchData) {
        fetchData();
      }
      cancelDeleteStudent();
    } catch (err) {
      setError("Failed to delete student. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get class name by ID
  const getClassNameById = (id) => {
    const classObj = classes.find((c) => c.id === id);
    return classObj
      ? `${classObj.class_number} (${classObj.class_code})`
      : "N/A";
  };

  // Get session year by ID
  const getSessionYearById = (id) => {
    const sessionObj = sessions.find((s) => s.id === id);
    return sessionObj ? sessionObj.start_year : "N/A";
  };

  // Handle view all students
  const handleViewAllStudents = () => {
    navigate("/admin/students/all");
  };
  
  // Handle show latest only
  const handleShowLatestOnly = () => {
    setShowLatestOnly(true);
    if (latestSessionId) {
      setFilterSession(latestSessionId);
    }
    setCurrentPage(1);
  };
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };
  
  // Clear messages after timeout
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <Container fluid>
      {showProfile && selectedStudent ? (
        <StudentProfile
          student={selectedStudent}
          onBack={() => setShowProfile(false)}
          onUpdate={loadData}
        />
      ) : (
        <>
          {viewMode === "list" && (
            <Row className="mb-4">
              <Col>
                <h3>Student Management</h3>
                <p>Manage student information and class assignments</p>
              </Col>
            </Row>
          )}

          {viewMode === "list" && (error || success) && (
            <Row className="mb-3">
              <Col>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
              </Col>
            </Row>
          )}

          {viewMode === "list" && (
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        Students {showLatestOnly && "(Latest Session)"}
                      </h5>
                      <small className="text-muted">
                        {showLatestOnly && latestSessionId && 
                          `Showing students from ${sessions.find(s => s.id === latestSessionId)?.start_year || "latest"} session`
                        }
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      {showLatestOnly ? (
                        <Button 
                          variant="outline-primary" 
                          onClick={handleViewAllStudents}
                        >
                          View All Students
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-secondary" 
                          onClick={handleShowLatestOnly}
                        >
                          Show Latest Only
                        </Button>
                      )}
                      <Button variant="primary" onClick={() => navigate("/admin/student/add")}>
                        <FaPlus className="me-1" /> Add Student
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="pb-2">
                    <Row className="mb-3">
                      <Col md={3}>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <Form.Select
                          value={filterClass}
                          onChange={(e) => setFilterClass(e.target.value)}
                        >
                          <option value="">All Classes</option>
                          {classes.map((classObj) => (
                            <option key={classObj.id} value={classObj.id}>
                              {classObj.class_number} ({classObj.class_code})
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={4}>
                        <Form.Select
                          value={filterSession}
                          onChange={(e) => setFilterSession(e.target.value)}
                        >
                          {sessions.map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.id === latestSessionId 
                                ? `Latest Session (${session.start_year} - ${session.end_year})`
                                : `${session.start_year} - ${session.end_year})`
                              }
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <div className="text-muted small">
                          Showing {paginatedStudents.length} of {processedStudents.length} students
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Body>
                    {loading && students.length === 0 ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </Spinner>
                      </div>
                    ) : paginatedStudents.length === 0 ? (
                      <p className="text-muted text-center">
                        {searchTerm
                          ? "No students match your search."
                          : "No students found. Add your first student."}
                      </p>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead>
                              <tr>
                                <th 
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSort("student_name")}
                                >
                                  Student Name {getSortIcon("student_name")}
                                </th>
                                <th 
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSort("registration_number")}
                                >
                                  Registration No. {getSortIcon("registration_number")}
                                </th>
                                <th 
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSort("father_name")}
                                >
                                  Father's Name {getSortIcon("father_name")}
                                </th>
                                <th 
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSort("class")}
                                >
                                  Current Class {getSortIcon("class")}
                                </th>
                                <th 
                                  style={{ cursor: "pointer" }}
                                  onClick={() => handleSort("registration_datetime")}
                                >
                                  Registration Date {getSortIcon("registration_datetime")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedStudents.map((student) => {
                                const assignment = getStudentAssignment(
                                  student.id
                                );
                                return (
                                  <tr key={student.id}>
                                    <td
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setShowProfile(true);
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <div className="d-flex align-items-center">
                                        <span>{student.student_name}</span>
                                      </div>
                                    </td>
                                    <td
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setShowProfile(true);
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {student.registration_number || "N/A"}
                                    </td>
                                    <td
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setShowProfile(true);
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {student.father_name}
                                    </td>
                                    <td
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setShowProfile(true);
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {assignment
                                        ? getClassNameById(assignment.class_id)
                                        : "N/A"}
                                    </td>
                                    <td
                                      onClick={() => {
                                        setSelectedStudent(student);
                                        setShowProfile(true);
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      {formatDateTime(
                                        student.registration_datetime
                                      )}
                                    </td>
                                    
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="text-muted">
                              Page {currentPage} of {totalPages}
                            </div>
                            <div className="btn-group" role="group">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                First
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </Button>
                              
                              {/* Page numbers */}
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              })}
                              
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                              >
                                Last
                              </Button>
                            </div>
                            <div className="text-muted">
                              {processedStudents.length} total students
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Student Modal */}
          <Modal show={showStudentModal} onHide={closeStudentForm} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {editingStudent ? "Edit Student" : "Add New Student"}
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleStudentFormSubmit}>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Student Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="studentName"
                        value={studentFormData.studentName}
                        onChange={handleStudentFormChange}
                        placeholder="Enter student name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Registration Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="registrationNumber"
                        value={studentFormData.registrationNumber}
                        onChange={handleStudentFormChange}
                        placeholder="Enter registration number"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Father Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="fatherName"
                        value={studentFormData.fatherName}
                        onChange={handleStudentFormChange}
                        placeholder="Enter father's name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mother Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="motherName"
                        value={studentFormData.motherName}
                        onChange={handleStudentFormChange}
                        placeholder="Enter mother's name"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        value={studentFormData.dob}
                        onChange={handleStudentFormChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="mobileNumber"
                        value={studentFormData.mobileNumber}
                        onChange={handleStudentFormChange}
                        placeholder="Enter mobile number"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={studentFormData.email}
                        onChange={handleStudentFormChange}
                        placeholder="Enter email address"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Student Image</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          // In a real app, you would upload the file to a server
                          // For now, we'll just show a preview
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setStudentFormData((prev) => ({
                                ...prev,
                                imageUrl: event.target.result,
                              }));
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                      {studentFormData.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={studentFormData.imageUrl}
                            alt="Preview"
                            style={{ maxWidth: "100px", maxHeight: "100px" }}
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeStudentForm}>
                  <FaTimes className="me-1" /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" />{" "}
                      {editingStudent ? "Update" : "Save"}
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Assignment Modal */}
          <Modal show={showAssignmentModal} onHide={closeStudentForm}>
            <Modal.Header closeButton>
              <Modal.Title>
                {assigningStudent &&
                  `Assign ${assigningStudent.student_name} to Class`}
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleAssignmentFormSubmit}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Class *</Form.Label>
                  <Form.Select
                    name="classId"
                    value={assignmentFormData.classId}
                    onChange={handleAssignmentFormChange}
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map((classObj) => (
                      <option key={classObj.id} value={classObj.id}>
                        {classObj.class_number} ({classObj.class_code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Session *</Form.Label>
                  <Form.Select
                    name="sessionId"
                    value={assignmentFormData.sessionId}
                    onChange={handleAssignmentFormChange}
                    required
                  >
                    <option value="">Select a session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        ({session.start_month}/{session.start_year} -{" "}
                        {session.end_month}/{session.end_year})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Roll Number *</Form.Label>
                  <Form.Control
                    type="text"
                    name="rollNumber"
                    value={assignmentFormData.rollNumber}
                    onChange={handleAssignmentFormChange}
                    placeholder="Enter 6-digit roll number"
                    required
                    maxLength={6}
                  />
                  <Form.Text className="text-muted">
                    Roll number must be exactly 6 digits.
                  </Form.Text>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeStudentForm}>
                  <FaTimes className="me-1" /> Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-1" /> Save Assignment
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal show={!!deletingStudent} onHide={cancelDeleteStudent}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {deletingStudent && (
                <p>
                  Are you sure you want to delete student "
                  <strong>{deletingStudent.student_name}</strong>"? This action
                  cannot be undone.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={cancelDeleteStudent}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteStudent}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Student Form (Full Page View) */}
          {(viewMode === "addStudent" || viewMode === "editStudent") && (
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {editingStudent ? "Edit Student" : "Add New Student"}
                  </h5>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={closeStudentForm}
                  >
                    <FaArrowLeft className="me-1" /> Back to List
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleStudentFormSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Student Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="studentName"
                          value={studentFormData.studentName}
                          onChange={handleStudentFormChange}
                          placeholder="Enter student name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Registration Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="registrationNumber"
                          value={studentFormData.registrationNumber}
                          onChange={handleStudentFormChange}
                          placeholder="Enter registration number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Father Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="fatherName"
                          value={studentFormData.fatherName}
                          onChange={handleStudentFormChange}
                          placeholder="Enter father's name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="motherName"
                          value={studentFormData.motherName}
                          onChange={handleStudentFormChange}
                          placeholder="Enter mother's name"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date of Birth *</Form.Label>
                        <Form.Control
                          type="date"
                          name="dob"
                          value={studentFormData.dob}
                          onChange={handleStudentFormChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mobile Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="mobileNumber"
                          value={studentFormData.mobileNumber}
                          onChange={handleStudentFormChange}
                          placeholder="Enter mobile number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={studentFormData.email}
                          onChange={handleStudentFormChange}
                          placeholder="Enter email address"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Student Image</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            // In a real app, you would upload the file to a server
                            // For now, we'll just show a preview
                            if (e.target.files && e.target.files[0]) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setStudentFormData((prev) => ({
                                  ...prev,
                                  imageUrl: event.target.result,
                                }));
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                        {studentFormData.imageUrl && (
                          <div className="mt-2">
                            <img
                              src={studentFormData.imageUrl}
                              alt="Preview"
                              style={{ maxWidth: "100px", maxHeight: "100px" }}
                            />
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={closeStudentForm}
                      disabled={loading}
                    >
                      <FaTimes className="me-1" /> Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-1" />{" "}
                          {editingStudent ? "Update" : "Save"}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Assignment Form (Full Page View) */}
          {viewMode === "assignStudent" && selectedStudentData && (
            <Card className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Assign {selectedStudentData.student_name} to Class
                  </h5>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={closeAssignmentForm}
                  >
                    <FaArrowLeft className="me-1" /> Back to List
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleAssignmentFormSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class *</Form.Label>
                    <Form.Select
                      name="classId"
                      value={assignmentFormData.classId}
                      onChange={handleAssignmentFormChange}
                      required
                    >
                      <option value="">Select a class</option>
                      {classes.map((classObj) => (
                        <option key={classObj.id} value={classObj.id}>
                          {classObj.class_number} ({classObj.class_code})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Session *</Form.Label>
                    <Form.Select
                      name="sessionId"
                      value={assignmentFormData.sessionId}
                      onChange={handleAssignmentFormChange}
                      required
                    >
                      <option value="">Select a session</option>
                      {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          ({session.start_month}/{session.start_year} -{" "}
                          {session.end_month}/{session.end_year})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Roll Number *</Form.Label>
                    <Form.Control
                      type="text"
                      name="rollNumber"
                      value={assignmentFormData.rollNumber}
                      onChange={handleAssignmentFormChange}
                      placeholder="Enter 6-digit roll number"
                      required
                      maxLength={6}
                    />
                    <Form.Text className="text-muted">
                      Roll number must be exactly 6 digits.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={closeAssignmentForm}
                      disabled={loading}
                    >
                      <FaTimes className="me-1" /> Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-1"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-1" /> Save Assignment
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default StudentManager;
