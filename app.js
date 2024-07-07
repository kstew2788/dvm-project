// DataVendingMachine object
const DataVendingMachine = {
  aiProviders: new Map(),
  jobTypes: new Map(),
  jobRequests: new Map(),
  completedJobs: [],
  reviews: [],
  currentUserPublicKey: 'user_public_key', // This would be set by the Pear framework
  currentProviderPublicKey: 'provider_public_key', // This would be set by the Pear framework

  initialize() {
    // Initialize with some default job types
    this.addJobType('text_generation', false)
    this.addJobType('image_generation', false)
    this.addJobType('translation', false)
    this.addJobType('text_to_voice', false)
  },

  addJobType(jobType, isRequested = true) {
    this.jobTypes.set(jobType, { isRequested, providers: new Set() })
    this.jobRequests.set(jobType, 0)
  },

  registerAiProvider(jobTypes, endpoint) {
    const publicKey = this.currentProviderPublicKey
    const provider = this.aiProviders.get(publicKey) || { jobTypes: new Set(), endpoint, ratings: [] }
    jobTypes.forEach(jobType => {
      provider.jobTypes.add(jobType)
      if (!this.jobTypes.has(jobType)) {
        this.addJobType(jobType, false)
      }
      this.jobTypes.get(jobType).providers.add(publicKey)
      if (this.jobTypes.get(jobType).isRequested) {
        this.jobTypes.get(jobType).isRequested = false
      }
    })
    this.aiProviders.set(publicKey, provider)
  },

  submitJob(jobType, inputData, expectedOutputSize) {
    if (!this.jobTypes.has(jobType)) {
      this.addJobType(jobType, true)
    }
    this.jobRequests.set(jobType, (this.jobRequests.get(jobType) || 0) + 1)

    const job = {
      id: Date.now().toString(),
      type: jobType,
      input: inputData,
      expectedOutputSize,
      status: 'pending',
      timestamp: Date.now(),
      userPublicKey: this.currentUserPublicKey
    }

    // In a real implementation, we would store the job and route it to a provider
    // For now, we'll just simulate processing
    setTimeout(() => this.simulateJobProcessing(job), 1000)

    return job
  },

  simulateJobProcessing(job) {
    const jobTypeInfo = this.jobTypes.get(job.type)
    if (!jobTypeInfo || jobTypeInfo.providers.size === 0) {
      job.status = 'unassigned'
      job.error = `No provider available for job type: ${job.type}`
    } else {
      job.status = 'completed'
      job.output = `Simulated output for ${job.type} job`
      job.providerPublicKey = Array.from(jobTypeInfo.providers)[0] // Simulate assignment to a provider
    }
    this.completedJobs.push(job)
    this.updateJobResults(job)
  },

  updateJobResults(job) {
    const jobResults = document.getElementById('jobResults')
    const li = document.createElement('li')
    li.innerHTML = `
      <strong>Job ID:</strong> ${job.id}<br>
      <strong>Type:</strong> ${job.type}<br>
      <strong>Status:</strong> ${job.status}<br>
      <strong>Input:</strong> ${job.input}<br>
      <strong>Output:</strong> ${job.output || job.error || 'Processing...'}
    `
    if (job.status === 'completed') {
      const rateButton = document.createElement('button')
      rateButton.textContent = 'Rate Job'
      rateButton.onclick = () => this.showRatingForm(job.id)
      li.appendChild(rateButton)
    }
    jobResults.appendChild(li)
  },

  showRatingForm(jobId) {
    const job = this.completedJobs.find(j => j.id === jobId)
    if (!job) return

    const ratingForm = document.createElement('form')
    ratingForm.innerHTML = `
      <h3>Rate Job ${jobId}</h3>
      <select required>
        <option value="">Select rating</option>
        <option value="1">1 Star</option>
        <option value="2">2 Stars</option>
        <option value="3">3 Stars</option>
        <option value="4">4 Stars</option>
        <option value="5">5 Stars</option>
      </select>
      <textarea placeholder="Optional feedback"></textarea>
      <button type="submit">Submit Rating</button>
    `
    ratingForm.onsubmit = (e) => {
      e.preventDefault()
      const rating = parseInt(e.target.elements[0].value)
      const feedback = e.target.elements[1].value
      this.rateProvider(job.providerPublicKey, rating, feedback)
      ratingForm.remove()
    }
    document.body.appendChild(ratingForm)
  },

  rateProvider(publicKey, rating, feedback) {
    const provider = this.aiProviders.get(publicKey)
    if (provider) {
      provider.ratings.push({ rating, feedback })
      alert(`Provider rated successfully!`)
      this.updateProviderList()
    }
  },

  getRegisteredProviders() {
    return Array.from(this.aiProviders.entries()).map(([publicKey, provider]) => ({
      publicKey,
      jobTypes: Array.from(provider.jobTypes),
      averageRating: provider.ratings.reduce((sum, r) => sum + r.rating, 0) / provider.ratings.length || 0,
      ratingCount: provider.ratings.length
    }))
  },

  getJobTypes() {
    return Array.from(this.jobTypes.entries()).map(([type, info]) => ({
      type,
      isRequested: info.isRequested,
      providerCount: info.providers.size,
      requestCount: this.jobRequests.get(type) || 0
    }))
  },

  getProviderRatings(publicKey) {
    const provider = this.aiProviders.get(publicKey)
    return provider ? provider.ratings : []
  },

  addReview(rating, text, isProvider = false) {
    const review = {
      id: Date.now().toString(),
      rating,
      text,
      isProvider,
      timestamp: new Date().toISOString(),
      responses: []
    }
    this.reviews.push(review)
    this.updateReviewsList()
  },

  respondToReview(reviewId, responseText, isProvider) {
    const review = this.reviews.find(r => r.id === reviewId)
    if (review) {
      review.responses.push({
        text: responseText,
        isProvider,
        timestamp: new Date().toISOString()
      })
      this.updateReviewsList()
    }
  },

  updateReviewsList() {
    const reviewsList = document.getElementById('reviewsList')
    reviewsList.innerHTML = this.reviews.map(review => `
      <li>
        <strong>Rating:</strong> ${review.rating} stars<br>
        <strong>Review:</strong> ${review.text}<br>
        <strong>By:</strong> ${review.isProvider ? 'Provider' : 'User'}<br>
        <strong>Date:</strong> ${new Date(review.timestamp).toLocaleString()}<br>
        <button onclick="showResponseForm('${review.id}')">Respond</button>
        <ul>
          ${review.responses.map(response => `
            <li>
              <strong>${response.isProvider ? 'Provider' : 'User'} Response:</strong> ${response.text}<br>
              <strong>Date:</strong> ${new Date(response.timestamp).toLocaleString()}
            </li>
          `).join('')}
        </ul>
      </li>
    `).join('')
  }
}

// Event listeners and UI updates
document.addEventListener('DOMContentLoaded', () => {
  DataVendingMachine.initialize()

  const providerForm = document.getElementById('providerForm')
  const jobForm = document.getElementById('jobForm')
  const jobTypeForm = document.getElementById('jobTypeForm')
  const showReviewsBtn = document.getElementById('showReviewsBtn')
  const leaveReviewBtn = document.getElementById('leaveReviewBtn')
  const reviewModal = document.getElementById('reviewModal')
  const reviewsListModal = document.getElementById('reviewsListModal')
  const reviewForm = document.getElementById('reviewForm')

  providerForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const jobTypes = document.getElementById('jobTypes').value.split(',').map(t => t.trim())
    const endpoint = document.getElementById('endpoint').value

    DataVendingMachine.registerAiProvider(jobTypes, endpoint)
    alert(`Provider registered successfully!`)
    updateProviderList()
    updateJobTypeList()
    updateJobTypeSelect()
  })

  jobForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const jobType = document.getElementById('jobType').value
    const inputData = document.getElementById('inputData').value
    const expectedOutputSize = document.getElementById('expectedOutputSize').value

    try {
      const job = DataVendingMachine.submitJob(jobType, inputData, expectedOutputSize)
      alert(`Job submitted successfully! Job ID: ${job.id}`)
      updateJobTypeList()
      updateJobTypeSelect()
    } catch (error) {
      alert(`Error submitting job: ${error.message}`)
    }
  })

  jobTypeForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const newJobType = document.getElementById('newJobType').value
    DataVendingMachine.addJobType(newJobType, true)
    alert(`New job type "${newJobType}" added as requested`)
    updateJobTypeList()
    updateJobTypeSelect()
  })

  showReviewsBtn.addEventListener('click', () => {
    DataVendingMachine.updateReviewsList()
    reviewsListModal.style.display = 'block'
  })

  leaveReviewBtn.addEventListener('click', () => {
    reviewModal.style.display = 'block'
  })

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const rating = document.getElementById('reviewRating').value
    const text = document.getElementById('reviewText').value
    DataVendingMachine.addReview(parseInt(rating), text)
    reviewModal.style.display = 'none'
    reviewForm.reset()
  })

  // Close modals when clicking on the close button
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').style.display = 'none'
    })
  })

  // Close modals when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none'
    }
  })

  function updateProviderList() {
    const providerList = document.getElementById('providerList')
    const providers = DataVendingMachine.getRegisteredProviders()
    providerList.innerHTML = providers.map(provider => `
      <li>
        <strong>Public Key:</strong> ${provider.publicKey}<br>
        <strong>Job Types:</strong> ${provider.jobTypes.join(', ')}<br>
        <strong>Average Rating:</strong> ${provider.averageRating.toFixed(2)} (${provider.ratingCount} ratings)
        <button onclick="showProviderRatings('${provider.publicKey}')">Show Ratings</button>
      </li>
    `).join('')
  }

  function updateJobTypeList() {
    const jobTypeList = document.getElementById('jobTypeList')
    const jobTypes = DataVendingMachine.getJobTypes()
    jobTypeList.innerHTML = jobTypes.map(jobType => `
      <li>
        <strong>${jobType.type}</strong> ${jobType.isRequested ? '(Requested)' : ''}<br>
        Providers: ${jobType.providerCount}, Requests: ${jobType.requestCount}
      </li>
    `).join('')
  }

  function updateJobTypeSelect() {
    const jobTypeSelect = document.getElementById('jobType')
    const jobTypes = DataVendingMachine.getJobTypes()
    jobTypeSelect.innerHTML = jobTypes.map(jobType => 
      `<option value="${jobType.type}">${jobType.type}${jobType.isRequested ? ' (Requested)' : ''}</option>`
    ).join('')
  }

  updateProviderList()
  updateJobTypeList()
  updateJobTypeSelect()
})

// Function to show provider ratings
function showProviderRatings(publicKey) {
  const ratings = DataVendingMachine.getProviderRatings(publicKey)
  const ratingsHtml = ratings.map(r => `<li>${r.rating} stars - ${r.feedback || 'No feedback provided'}</li>`).join('')
  const ratingsDisplay = document.createElement('div')
  ratingsDisplay.innerHTML = `
    <h3>Ratings for provider ${publicKey}</h3>
    <ul>${ratingsHtml}</ul>
    <button onclick="this.parentElement.remove()">Close</button>
  `
  document.body.appendChild(ratingsDisplay)
}

// Function to show response form for a review
function showResponseForm(reviewId) {
  const responseForm = document.createElement('form')
  responseForm.innerHTML = `
    <textarea placeholder="Your response" required></textarea>
    <button type="submit">Submit Response</button>
  `
  responseForm.onsubmit = (e) => {
    e.preventDefault()
    const responseText = e.target.elements[0].value
    DataVendingMachine.respondToReview(reviewId, responseText, false) // Set to true for provider responses
    responseForm.remove()
  }
  document.getElementById('reviewsList').appendChild(responseForm)
}

// Keep the original click listener
document.querySelector('h1').addEventListener('click', (e) => { 
  e.target.innerHTML = '🍐'
})