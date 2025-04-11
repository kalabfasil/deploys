// DOM Elements
const examForm = document.getElementById('examForm');
const resultsTable = document.getElementById('resultsTable');
const resultsBody = document.getElementById('resultsBody');
const noResults = document.getElementById('noResults');
const filterStudent = document.getElementById('filterStudent');
const filterSubject = document.getElementById('filterSubject');
const clearFilters = document.getElementById('clearFilters');
const totalStudents = document.getElementById('totalStudents');
const totalExams = document.getElementById('totalExams');
const topPerformer = document.getElementById('topPerformer');
const avgScore = document.getElementById('avgScore');
const modal = document.getElementById('resultModal');
const closeModal = document.querySelector('.close-modal');
const closeModalBtn = document.getElementById('closeModalBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const toastIcon = document.getElementById('toastIcon');
const closeToast = document.getElementById('closeToast');

// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

// Toast Types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning'
};

// Application State
let examResults = [];
let activeToastTimeout;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Load exam results from localStorage
  loadExamResults();
  
  // Initialize UI
  renderResults();
  updateStatistics();
  updateFilters();
  initializeEventListeners();
  
  // Add scroll event listener for header
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // Add animation to statistics
  animateCounters();
});

/**
 * Initialize all event listeners
 */
const initializeEventListeners = () => {
  // Mobile menu toggle
  hamburger.addEventListener('click', toggleMobileMenu);
  
  // Close mobile menu when clicking a link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });
  
  // Form submission
  examForm.addEventListener('submit', handleFormSubmit);
  
  // Filter events
  clearFilters.addEventListener('click', clearAllFilters);
  filterStudent.addEventListener('change', filterResults);
  filterSubject.addEventListener('change', filterResults);
  
  // Modal events
  closeModal.addEventListener('click', hideModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });
  
  // Toast events
  if (closeToast) closeToast.addEventListener('click', hideToast);
  
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal.style.display === 'block') hideModal();
      if (!toast.classList.contains('hidden')) hideToast();
    }
  });
  
  // Add smooth scrolling to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      if (this.getAttribute('href') === '#') return;
      
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
};

/**
 * Toggle mobile menu visibility
 */
const toggleMobileMenu = () => {
  hamburger.classList.toggle('active');
  navLinks.classList.toggle('active');
  
  // Animate hamburger icon
  const spans = hamburger.querySelectorAll('span');
  if (hamburger.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
  } else {
    spans[0].style.transform = 'none';
    spans[1].style.opacity = '1';
    spans[2].style.transform = 'none';
  }
};

/**
 * Close mobile menu
 */
const closeMobileMenu = () => {
  hamburger.classList.remove('active');
  navLinks.classList.remove('active');
  
  // Reset hamburger icon
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = 'none';
  spans[1].style.opacity = '1';
  spans[2].style.transform = 'none';
};

/**
 * Load exam results from localStorage
 */
const loadExamResults = () => {
  try {
    const savedResults = localStorage.getItem('examResults');
    examResults = savedResults ? JSON.parse(savedResults) : [];
  } catch (error) {
    console.error('Error loading exam results:', error);
    examResults = [];
    showToast('Error loading saved results. Starting with empty data.', TOAST_TYPES.ERROR);
  }
};

/**
 * Save exam results to localStorage
 */
const saveExamResults = () => {
  try {
    localStorage.setItem('examResults', JSON.stringify(examResults));
  } catch (error) {
    console.error('Error saving exam results:', error);
    showToast('Could not save results to local storage', TOAST_TYPES.ERROR);
  }
};

/**
 * Handle form submission for adding a new exam result
 * @param {Event} e - The form submission event
 */
const handleFormSubmit = (e) => {
  e.preventDefault();
  
  // Get form values
  const formData = {
    studentName: document.getElementById('studentName').value.trim(),
    relationship: document.getElementById('relationship').value,
    examName: document.getElementById('examName').value.trim(),
    examDate: document.getElementById('examDate').value,
    subject: document.getElementById('subject').value.trim(),
    grade: document.getElementById('grade').value.trim(),
    comments: document.getElementById('comments').value.trim(),
  };
  
  // Validate form data
  if (!formData.studentName || !formData.relationship || !formData.examName || 
      !formData.examDate || !formData.subject || !formData.grade) {
    showToast('Please fill in all required fields', TOAST_TYPES.ERROR);
    return;
  }
  
  // Create result object with unique ID
  const newResult = {
    id: Date.now(),
    ...formData,
    timestamp: new Date().toISOString()
  };
  
  // Add to results array
  examResults.push(newResult);
  
  // Save to localStorage
  saveExamResults();
  
  // Reset form
  examForm.reset();
  
  // Update UI
  renderResults();
  updateStatistics();
  updateFilters();
  
  // Show success message
  showToast('Exam result added successfully!', TOAST_TYPES.SUCCESS);
  
  // Scroll to results section
  document.querySelector('#view-results').scrollIntoView({ behavior: 'smooth' });
};

/**
 * Render the results table or empty state
 * @param {Array} filteredResults - Optional filtered results to display
 */
const renderResults = (filteredResults = null) => {
  const results = filteredResults || examResults;
  
  // Clear results table
  resultsBody.innerHTML = '';
  
  if (results.length === 0) {
    // Show empty state
    resultsTable.style.display = 'none';
    noResults.style.display = 'block';
  } else {
    // Show results table
    resultsTable.style.display = 'table';
    noResults.style.display = 'none';
    
    // Add results to table
    results.forEach(result => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(result.examDate);
      const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
      
      row.innerHTML = `
        <td>${result.studentName}</td>
        <td>${result.relationship}</td>
        <td>${result.examName}</td>
        <td>${formattedDate}</td>
        <td>${result.subject}</td>
        <td>${result.grade}</td>
        <td>
          <button class="action-btn view-btn" data-id="${result.id}" aria-label="View details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${result.id}" aria-label="Delete result">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      
      resultsBody.appendChild(row);
    });
    
    // Add event listeners to view and delete buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', viewResult);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', deleteResult);
    });
  }
};

/**
 * View result details in a modal
 * @param {Event} e - The click event
 */
const viewResult = (e) => {
  const resultId = parseInt(e.currentTarget.getAttribute('data-id'));
  const result = examResults.find(res => res.id === resultId);
  
  if (result) {
    // Format date
    const date = new Date(result.examDate);
    const formattedDate = date.toLocaleDateString(undefined, {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    // Populate modal
    document.getElementById('modalStudentName').textContent = result.studentName;
    document.getElementById('modalRelationship').textContent = result.relationship;
    document.getElementById('modalExamName').textContent = result.examName;
    document.getElementById('modalExamDate').textContent = formattedDate;
    document.getElementById('modalSubject').textContent = result.subject;
    document.getElementById('modalGrade').textContent = result.grade;
    document.getElementById('modalComments').textContent = result.comments || 'No comments provided';
    
    // Show modal
    showModal();
  }
};

/**
 * Show the modal
 */
const showModal = () => {
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

/**
 * Hide the modal
 */
const hideModal = () => {
  modal.style.display = 'none';
  document.body.style.overflow = ''; // Restore scrolling
};

/**
 * Delete a result after confirmation
 * @param {Event} e - The click event
 */
const deleteResult = (e) => {
  const resultId = parseInt(e.currentTarget.getAttribute('data-id'));
  const result = examResults.find(res => res.id === resultId);
  
  if (confirm(`Are you sure you want to delete the exam result for ${result.studentName}?`)) {
    // Remove from array
    examResults = examResults.filter(res => res.id !== resultId);
    
    // Save to localStorage
    saveExamResults();
    
    // Update UI
    renderResults();
    updateStatistics();
    updateFilters();
    
    // Show success message
    showToast('Result deleted successfully', TOAST_TYPES.SUCCESS);
  }
};

/**
 * Update filters based on available data
 */
const updateFilters = () => {
  // Clear existing options
  filterStudent.innerHTML = '<option value="all">All Students</option>';
  filterSubject.innerHTML = '<option value="all">All Subjects</option>';
  
  // Get unique students and subjects
  const students = [...new Set(examResults.map(res => res.studentName))].sort();
  const subjects = [...new Set(examResults.map(res => res.subject))].sort();
  
  // Add options to student filter
  students.forEach(student => {
    const option = document.createElement('option');
    option.value = student;
    option.textContent = student;
    filterStudent.appendChild(option);
  });
  
  // Add options to subject filter
  subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    filterSubject.appendChild(option);
  });
};

/**
 * Filter results based on selected criteria
 */
const filterResults = () => {
  const studentFilter = filterStudent.value;
  const subjectFilter = filterSubject.value;
  
  // Start with all results
  let filteredResults = examResults;
  
  // Apply student filter
  if (studentFilter !== 'all') {
    filteredResults = filteredResults.filter(res => res.studentName === studentFilter);
  }
  
  // Apply subject filter
  if (subjectFilter !== 'all') {
    filteredResults = filteredResults.filter(res => res.subject === subjectFilter);
  }
  
  // Render filtered results
  renderResults(filteredResults);
};

/**
 * Clear all filters
 */
const clearAllFilters = () => {
  filterStudent.value = 'all';
  filterSubject.value = 'all';
  renderResults();
  
  // Show brief confirmation
  showToast('Filters cleared', TOAST_TYPES.SUCCESS);
};

/**
 * Update statistics with current data
 */
const updateStatistics = () => {
  if (examResults.length === 0) {
    totalStudents.textContent = '0';
    totalExams.textContent = '0';
    topPerformer.textContent = '-';
    avgScore.textContent = '-';
    return;
  }
  
  // Count unique students
  const uniqueStudents = new Set(examResults.map(result => result.studentName));
  totalStudents.textContent = uniqueStudents.size;
  
  // Total exams
  totalExams.textContent = examResults.length;
  
  // Calculate top performer
  const studentPerformance = {};
  examResults.forEach(result => {
    if (!studentPerformance[result.studentName]) {
      studentPerformance[result.studentName] = {
        totalScore: 0,
        count: 0
      };
    }
    
    // Try to parse numeric score, if not just count the exam
    const score = parseFloat(result.grade) || 1;
    studentPerformance[result.studentName].totalScore += score;
    studentPerformance[result.studentName].count += 1;
  });
  
  // Find student with highest average score
  let topScore = 0;
  let bestStudent = '';
  
  for (const student in studentPerformance) {
    const avgStudentScore = studentPerformance[student].totalScore / studentPerformance[student].count;
    if (avgStudentScore > topScore) {
      topScore = avgStudentScore;
      bestStudent = student;
    }
  }
  
  topPerformer.textContent = bestStudent || '-';
  
  // Calculate average score
  let totalScore = 0;
  let validScores = 0;
  
  examResults.forEach(result => {
    const score = parseFloat(result.grade);
    if (!isNaN(score)) {
      totalScore += score;
      validScores++;
    }
  });
  
  // Calculate average if there are valid scores
  if (validScores > 0) {
    const average = (totalScore / validScores).toFixed(1);
    avgScore.textContent = average;
  } else {
    avgScore.textContent = '-';
  }
};

/**
 * Animate counter elements
 */
const animateCounters = () => {
  const counters = document.querySelectorAll('.counter');
  
  // Set up intersection observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const finalValue = parseInt(target.textContent);
        
        if (finalValue === 0 || isNaN(finalValue)) return;
        
        let count = 0;
        const duration = 1500; // ms
        const interval = Math.max(30, Math.floor(duration / finalValue));
        
        const counter = setInterval(() => {
          count++;
          target.textContent = count;
          
          if (count >= finalValue) {
            clearInterval(counter);
          }
        }, interval);
        
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  
  // Observe all counter elements
  counters.forEach(counter => {
    observer.observe(counter);
  });
};

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, warning)
 * @param {number} duration - How long to show the notification in ms
 */
const showToast = (message, type = TOAST_TYPES.SUCCESS, duration = 3000) => {
  // Clear any existing timeout
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
  }
  
  // Set message and icon
  toastMessage.textContent = message;
  
  // Set icon based on type
  switch (type) {
    case TOAST_TYPES.SUCCESS:
      toastIcon.className = 'fas fa-check-circle';
      break;
    case TOAST_TYPES.ERROR:
      toastIcon.className = 'fas fa-exclamation-circle';
      break;
    case TOAST_TYPES.WARNING:
      toastIcon.className = 'fas fa-exclamation-triangle';
      break;
  }
  
  // Set toast type class
  toast.className = `toast ${type}`;
  
  // Show toast
  toast.classList.remove('hidden');
  
  // Hide toast after duration
  activeToastTimeout = setTimeout(() => {
    hideToast();
  }, duration);
};

/**
 * Hide the toast notification
 */
const hideToast = () => {
  toast.classList.add('hidden');
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }
}; 