import React, { useState, useEffect, MouseEvent, ChangeEvent } from 'react'
import axios from 'axios'
import { ClipLoader } from 'react-spinners'
import { BsCamera } from 'react-icons/bs'
import { IoIosOptions } from 'react-icons/io'
import { IoSendSharp, IoCloseSharp, IoChevronDown } from 'react-icons/io5'
import {
  FaArrowLeftLong,
  FaArrowRightLong,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa6'
import { capitalizeString } from 'utils'
import localData from 'cache'

interface FormData {
  allergies: string
  dietGoal: string
  dietaryPreference: string
  healthConditions: string
  fitnessLevel: string
  lifeStage: string
  meal: string
}

interface AlternativeInfo {
  name: string
  ingredients: string[]
  recipe: string[]
  comparison: string[]
}

interface Alternative {
  name: string
  ingredients: { isOpen: boolean; content: string[] }
  recipe: { isOpen: boolean; content: string[] }
  comparison: { isOpen: boolean; content: string }
}

interface AlternativeInfo {
  name: string
  ingredients: string[]
  recipe: string[]
  comparison: string[]
}

interface AIResponse {
  overview: string
  alternatives: Alternative[]
}

const FOOD_DELIVERY_SERVICES = [
  {
    id: 1,
    label: 'Chowdeck',
    link: 'https://chowdeck.com',
    logo: '/images/chowdeck-logo.png'
  },
  {
    id: 2,
    label: 'Doordash',
    link: 'https://doordash.com',
    logo: '/images/doordash-logo.png'
  },
  {
    id: 3,
    label: 'Glovo',
    link: 'https://glovoapp.com',
    logo: '/images/glovo-logo.png'
  },
  {
    id: 4,
    label: 'Jumia',
    link: 'https://jumia.com.ng',
    logo: '/images/jumia-foods-logo.png'
  },
  {
    id: 5,
    label: 'Uber Eats',
    link: 'https://ubereats.com',
    logo: '/images/uber-eats-logo.png'
  },
  {
    id: 6,
    label: 'Zomato',
    link: 'https://zomato.com/india',
    logo: '/images/zomato-logo.png'
  }
]

const HomePage: React.FC = () => {
  const [sideMenuIsVisible, setSideMenuIsVisible] = useState<boolean>(true)
  const [rememberData, setRememberData] = useState<boolean>(false)
  const [isFetchingResponse, setIsFetchingResponse] = useState<boolean>(false)
  const [isBuying, setIsBuying] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  )
  const [activeTab, setActiveTab] = useState<'alternatives' | 'overview'>(
    'alternatives'
  )
  const [currentAlternativeIndex, setCurrentAlternativeIndex] =
    useState<number>(0)
  const [latestAIResponse, setLatestAIResponse] = useState<AIResponse | null>(
    null
  )

  const cachedMeals = [
    'fried puff puff',
    'shawarma',
    'jam doughnut',
    'milky doughnut'
  ]

  const handleBuyIngredients = () => {
    console.log(
      'Buy ingredients:',
      latestAIResponse?.alternatives[currentAlternativeIndex]
    )

    setIsBuying(true)
  }

  const handleBuyAlternative = () => {
    console.log(
      'Buy alternative:',
      latestAIResponse?.alternatives[currentAlternativeIndex]
    )

    setIsBuying(true)
  }

  const toggleSection = (section: 'comparison' | 'ingredients' | 'recipe') => {
    console.log('toggling...', section)
    setLatestAIResponse((prevState) => ({
      ...prevState!,
      alternatives: prevState!.alternatives.map((alternative, index) => {
        if (index === currentAlternativeIndex) {
          console.log(index, currentAlternativeIndex)

          return {
            ...alternative,
            [section]: {
              ...alternative[section],
              ...{ isOpen: !(alternative[section] as AlternativeInfo).isOpen }
            }
          }
        }
        return alternative
      })
    }))
  }

  const [fitnessLevelDropdownOpen, setFitnessLevelDropdownOpen] =
    useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({
    allergies: '',
    dietGoal: '',
    dietaryPreference: '',
    healthConditions: '',
    fitnessLevel: '',
    lifeStage: '',
    meal: ''
  })

  useEffect(() => {
    const storedRememberData = localStorage.getItem('rememberData')
    if (storedRememberData) {
      setRememberData(JSON.parse(storedRememberData))
    }

    const storedFormData = localStorage.getItem('formData')
    if (storedFormData) {
      console.log('Data: ', JSON.parse(storedFormData))
      setFormData(JSON.parse(storedFormData))
    }
  }, [])

  const handleRememberDataChange = (
    e: MouseEvent<HTMLButtonElement> | ChangeEvent<HTMLInputElement>
  ) => {
    e.preventDefault()
    setRememberData(!rememberData)
    localStorage.setItem('rememberData', JSON.stringify(!rememberData))

    if (!rememberData) {
      localStorage.setItem('formData', JSON.stringify(formData))
    } else {
      localStorage.removeItem('formData')
    }
  }

  const handleFitnessLevelChange = (level: string) => {
    setFormData({ ...formData, fitnessLevel: level })
    setFitnessLevelDropdownOpen(false)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      if (checked) {
        setFormData((prevData) => ({
          ...prevData,
          [name]: [...prevData[name as keyof FormData], value]
        }))
      } else {
        setFormData((prevData) => ({
          ...prevData,
          [name]: prevData[name as keyof FormData].filter(
            (item) => item !== value
          )
        }))
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value
      }))
    }
  }

  const validateForm = () => {
    const {
      meal,
      allergies,
      dietGoal,
      dietaryPreference,
      healthConditions,
      fitnessLevel,
      lifeStage
    } = formData

    if (!meal.trim()) {
      return false
    }

    if (
      !allergies.trim() &&
      !dietGoal.trim() &&
      !dietaryPreference.trim() &&
      !healthConditions.trim() &&
      !fitnessLevel.trim() &&
      !lifeStage.trim()
    ) {
      return false
    }

    return true
  }

  const transformAIResponse = (responseBody: unknown): AIResponse => {
    const { overview, alternatives } = responseBody

    const transformedAlternatives: Alternative[] = alternatives.map(
      (alt: unknown) => ({
        name: alt.name,
        comparison: { isOpen: false, content: alt.comparison },
        ingredients: { isOpen: false, content: alt.ingredients },
        recipe: { isOpen: false, content: alt.recipe }
      })
    )

    const transformedResponse: AIResponse = {
      overview,
      alternatives: transformedAlternatives
    }

    return transformedResponse
  }

  const startConversationWithAI = async () => {
    const formIsValid = validateForm()

    if (formIsValid) {
      if (cachedMeals.includes(formData.meal.toLowerCase())) {
        console.log(
          'Loading from cache: ',
          localData[formData.meal.toLowerCase()]
        )
        setIsFetchingResponse(true)
        setTimeout(() => {
          setIsFetchingResponse(false)
          setLatestAIResponse(localData[formData.meal.toLowerCase()])
        }, [2000])

        return
      }
      setIsFetchingResponse(true)
      console.log('Form data: ', formData)

      const newMessage = { role: 'user', content: JSON.stringify(formData) }

      try {
        const response = await axios.post('/api/v1/ai-conversation', {
          messageHistory: [...messages, newMessage]
        })

        if (JSON.parse(response.data.msg.content[0].text)?.error) {
          alert('Your input has no relation with food health')
        }
        const aiResponse = transformAIResponse(
          JSON.parse(response.data.msg.content[0].text)
        )

        console.log('Parsed Response: ', aiResponse)

        setLatestAIResponse(aiResponse)

        setMessages([])
      } catch (error) {
        console.error(error)
        alert(
          'We encountered a problem while trying to recommend your healthier dishes. Please try again later'
        )
      } finally {
        setIsFetchingResponse(false)
      }
    } else {
      alert(
        "Please provide your health information to help you better. We don't know you, your data is safe and doesn't leave your device"
      )
    }
  }

  return (
    <div className="relative flex flex-col items-start justify-center h-full overflow-y-scroll">
      <div
        className={`my-auto ${
          sideMenuIsVisible ? 'w-2/3' : 'w-full'
        } flex-col items-center justify-center`}
      >
        {/* A. Topmost section */}
        <div className="mb-12 flex items-center justify-between px-4 ">
          {/* Logo */}
          <div className="flex-1 text-center">
            <h1 className="font-[cursive] text-4xl font-medium tracking-wider">
              <span>health</span>
              <span className="text-teal-500">ALT</span>
            </h1>
          </div>
          {!sideMenuIsVisible && (
            <div className="absolute top-2 right-0 flex items-center space-x-4">
              <button
                onClick={() => setSideMenuIsVisible(true)}
                className="rounded-full p-2 transition-colors ease-in-out hover:bg-gray-800 dark:bg-teal-700 dark:hover:bg-teal-600"
              >
                <IoIosOptions size={24} />
              </button>
            </div>
          )}
        </div>

        {/* B. Next section */}
        <div
          className={`h-full mx-auto ${
            sideMenuIsVisible ? 'w-3/4' : 'w-1/2'
          } space-y-4 px-4`}
        >
          {/* Greeting */}
          <h2 className="text-center text-4xl font-medium">
            Hello, My Favorite Human
          </h2>
          {/* Input section */}
          <div className="relative">
            <input
              value={formData.meal}
              onChange={handleFormChange}
              name="meal"
              type="text"
              placeholder="What junk am I helping you with today?"
              className="w-full rounded-2xl border border-gray-300 py-4 pl-6 pr-24 outline-none transition-colors ease-in-out focus:outline-none focus:ring-2  focus:ring-teal-700 dark:border-teal-800 dark:bg-gray-800 dark:hover:border-teal-700"
            />
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 space-x-2">
              <button
                disabled={isFetchingResponse}
                className="rounded-lg border px-3 py-2 dark:border-teal-900/80 dark:bg-gray-900"
              >
                <BsCamera size={18} />
              </button>
              <button
                disabled={isFetchingResponse}
                onClick={startConversationWithAI}
                className={`flex items-center rounded-lg text-white bg-teal-700 px-3 py-2 transition-colors ease-in-out dark:bg-teal-500 dark:hover:bg-teal-600 ${
                  isFetchingResponse ? 'opacity-70' : ''
                }`}
              >
                <span className="mt-0.5">healthALT</span>
                {isFetchingResponse ? (
                  <ClipLoader
                    color={'#FFF'}
                    loading={isFetchingResponse}
                    size={18}
                    className="ml-2"
                  />
                ) : (
                  <IoSendSharp size={18} className="ml-2" />
                )}
              </button>
            </div>
          </div>

          {isBuying ? (
            <div className="mt-4 h-full flex-1 flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <div className="items-center flex justify-start">
                  <button
                    onClick={() => setIsBuying(false)}
                    className="rounded-full p-2 transition-colors ease-in-out dark:hover:bg-gray-800"
                  >
                    <FaArrowLeftLong size={24} className="text-teal-500" />
                  </button>
                </div>

                <h3 className="text-2xl flex-1 text-center text-teal-500 font-medium">
                  Continue Shopping From
                </h3>
              </div>

              <div className="mb-4 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4">
                  {FOOD_DELIVERY_SERVICES.map((service) => (
                    <a
                      key={service.id}
                      href={service.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-gray-300/40 px-10 py-4 hover:bg-teal-600 hover:border-teal-600 transition-colors ease-in-out"
                    >
                      <div className="flex flex-col items-center">
                        <img
                          src={service.logo}
                          alt={service.label}
                          className="w-24 h-24 mb-2 object-contain"
                        />
                        <span className="font-medium">{service.label}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {latestAIResponse && (
                <div className="h-full flex-1 flex flex-col">
                  <div className="mb-4 flex items-center space-x-4 mx-auto border border w-min px-3 py-[0.35rem] rounded-md bg-gray-800 border-gray-800">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`rounded-md px-4 py-2 transition-colors ease-in-out ${
                        activeTab === 'overview'
                          ? 'bg-teal-500 text-white'
                          : ' text-gray-800 hover:bg-gray-300 dark:bg-gray-700/20 dark:text-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('alternatives')}
                      className={`rounded-md px-4 py-2 transition-colors ease-in-out ${
                        activeTab === 'alternatives'
                          ? 'bg-teal-500 text-white'
                          : 'text-gray-800 hover:bg-gray-300 dark:bg-gray- dark:text-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Alternatives
                    </button>
                  </div>

                  <div className="response-container bg-gray-800 rounded-md border border-gray-800 max-h-[40vh] overflow-y-scroll">
                    {activeTab === 'overview' ? (
                      <div className="p-4">{latestAIResponse.overview}</div>
                    ) : (
                      <div className="p-4">
                        <h2 className="mb-4 text-center text-2xl">
                          {
                            latestAIResponse.alternatives[
                              currentAlternativeIndex
                            ].name
                          }
                        </h2>

                        <div>
                          <div
                            className="group mb-4 flex cursor-pointer items-center justify-between rounded-md bg-gray-900 border border-gray-900 hover:border-gray-700 p-2 hover:bg-gray-700 transition ease-in-out"
                            onClick={() => toggleSection('comparison')}
                          >
                            <span>Comparison</span>
                            {latestAIResponse.alternatives[
                              currentAlternativeIndex
                            ].comparison.isOpen ? (
                              <FaChevronDown
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            ) : (
                              <FaChevronRight
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            )}
                          </div>
                          {latestAIResponse.alternatives[
                            currentAlternativeIndex
                          ].comparison.isOpen && (
                            <div className="mb-4 rounded-md bg-gray-700 p-4">
                              {
                                latestAIResponse.alternatives[
                                  currentAlternativeIndex
                                ].comparison.content
                              }
                            </div>
                          )}

                          <div
                            className="group mb-4 flex cursor-pointer items-center justify-between rounded-md bg-gray-900 border border-gray-900 hover:border-gray-700 p-2 hover:bg-gray-700 transition ease-in-out"
                            onClick={() => toggleSection('ingredients')}
                          >
                            <span>Ingredients</span>
                            {latestAIResponse.alternatives[
                              currentAlternativeIndex
                            ].ingredients.isOpen ? (
                              <FaChevronDown
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            ) : (
                              <FaChevronRight
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            )}
                          </div>

                          {latestAIResponse.alternatives[
                            currentAlternativeIndex
                          ].ingredients.isOpen && (
                            <div className="mb-4 rounded-md bg-gray-700 p-4">
                              <ul>
                                {latestAIResponse.alternatives[
                                  currentAlternativeIndex
                                ].ingredients.content.map(
                                  (ingredient, index) => (
                                    <li key={index} className="mb-2">
                                      {ingredient}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          <div
                            className="group mb-4 flex cursor-pointer items-center justify-between rounded-md bg-gray-900 border border-gray-900 hover:border-gray-700 p-2 hover:bg-gray-700 transition ease-in-out"
                            onClick={() => toggleSection('recipe')}
                          >
                            <span>Recipe</span>
                            {latestAIResponse.alternatives[
                              currentAlternativeIndex
                            ].recipe.isOpen ? (
                              <FaChevronDown
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            ) : (
                              <FaChevronRight
                                className="text-teal-700 group-hover:text-teal-500"
                                size={20}
                              />
                            )}
                          </div>

                          {latestAIResponse.alternatives[
                            currentAlternativeIndex
                          ].recipe.isOpen && (
                            <div className="mb-4 rounded-md bg-gray-700 p-4">
                              <ol className="list-decimal pl-4">
                                {latestAIResponse.alternatives[
                                  currentAlternativeIndex
                                ].recipe.content.map((step, index) => (
                                  <li key={index} className="mb-2">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {activeTab === 'alternatives' && (
                      <button
                        onClick={() =>
                          setCurrentAlternativeIndex((prevIndex) =>
                            Math.max(prevIndex - 1, 0)
                          )
                        }
                        className={`rounded-full p-2 transition-colors ease-in-out dark:hover:bg-gray-800 ${
                          currentAlternativeIndex === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={currentAlternativeIndex === 0}
                      >
                        <FaArrowLeftLong size={24} className="text-teal-500" />
                      </button>
                    )}

                    <div className="w-full flex items-center justify-center space-x-4">
                      <button
                        onClick={handleBuyIngredients}
                        className="rounded-md bg-transparent hover:bg-teal-600 px-4 py-2 text-white transition-colors ease-in-out border-2 border-teal-600 focus:ring-4 focus:ring-teal-800"
                      >
                        Buy Ingredients
                      </button>
                      <button
                        onClick={handleBuyAlternative}
                        className="rounded-md bg-teal-500 border-2 border-teal-500 hover:border-teal-600 px-10 py-2 text-white transition-colors ease-in-out hover:bg-teal-600 focus:ring-4 focus:ring-teal-800"
                      >
                        Buy Meal
                      </button>
                    </div>

                    {activeTab === 'alternatives' && (
                      <button
                        onClick={() =>
                          setCurrentAlternativeIndex((prevIndex) =>
                            Math.min(
                              prevIndex + 1,
                              latestAIResponse.alternatives.length - 1
                            )
                          )
                        }
                        className={`rounded-full p-2 transition-colors ease-in-out dark:hover:bg-gray-800 ${
                          currentAlternativeIndex ===
                          latestAIResponse.alternatives.length - 1
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={
                          currentAlternativeIndex ===
                          latestAIResponse.alternatives.length - 1
                        }
                      >
                        <FaArrowRightLong size={24} className="text-teal-500" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Side Menu */}
      <div
        className={`flex flex-col justify-center fixed right-0 top-0 h-screen w-1/3 border-l-2 border-l-gray-700 shadow-black/30 px-6 shadow-lg transition-transform duration-300 dark:bg-gray-900 ${
          sideMenuIsVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setSideMenuIsVisible(false)}
            className="rounded-full p-2 transition-colors ease-in-out dark:hover:bg-gray-800"
          >
            <IoCloseSharp size={24} className="text-teal-500" />
          </button>
        </div>
        <div className="px-4">
          {/* <h2 className="mb-4 text-center text-2xl font-medium">
            Health Information
          </h2> */}
          <div className="mb-4">
            <label htmlFor="allergies" className="mb-2 block">
              Allergies
            </label>
            <input
              type="text"
              name="allergies"
              value={formData.allergies}
              placeholder="Ex. Peanuts, Groundnut oil (comma-separated)"
              className="w-full rounded-lg  border px-4 py-2 outline-none transition-colors ease-in-out placeholder:text-gray-300/40 focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700"
              onChange={handleFormChange}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="healthConditions" className="mb-2 block">
              Health Conditions
            </label>
            <input
              type="text"
              name="healthConditions"
              value={formData.healthConditions}
              placeholder="Ex. Diabetes, Heart Disease (comma-separated)"
              className="w-full rounded-lg  border px-4 py-2 outline-none transition-colors ease-in-out placeholder:text-gray-300/40 focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700"
              onChange={handleFormChange}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="dietaryPreference" className="mb-2 block">
              Dietary Preference
            </label>
            <input
              type="text"
              name="dietaryPreference"
              value={formData.dietaryPreference}
              placeholder="Ex. Halal, Vegetarian, Vegan (comma-separated)"
              className="w-full rounded-lg border px-4 py-2 outline-none transition-colors ease-in-out placeholder:text-gray-300/40 focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700"
              onChange={handleFormChange}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="fitnessLevel" className="mb-2 block">
              Fitness Level
            </label>
            <div className="relative">
              <button
                className={`w-full rounded-md border px-4 py-2 text-left transition-colors ease-in-out focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700 ${
                  !formData.fitnessLevel ? ' text-gray-300/40' : ''
                }`}
                onClick={() => {
                  setFitnessLevelDropdownOpen(!fitnessLevelDropdownOpen)
                }}
              >
                {capitalizeString(formData.fitnessLevel) ||
                  'Select Fitness Level'}
              </button>
              <div className="absolute left-[90%] top-[0.55rem] w-full">
                <IoChevronDown size={24} className="text-teal-500" />
              </div>
              {fitnessLevelDropdownOpen && (
                <div className="absolute left-0 top-14 w-full rounded-md border border-gray-300 bg-white shadow-md ring-2 ring-teal-700 dark:border-teal-700 dark:bg-gray-800">
                  <button
                    className={`w-full rounded-md px-4 py-2 hover:rounded-none hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-teal-700`}
                    onClick={() => handleFitnessLevelChange('sedentary')}
                  >
                    Sedentary (Little or no exercise)
                  </button>
                  <button
                    className={`w-full rounded-md px-4 py-2 hover:rounded-none hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-teal-700`}
                    onClick={() => handleFitnessLevelChange('moderate')}
                  >
                    Moderate (Exercise 3-5 days/week)
                  </button>
                  <button
                    className={`w-full rounded-md px-4 py-2 hover:rounded-none hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-teal-700`}
                    onClick={() => handleFitnessLevelChange('active')}
                  >
                    Active (Exercise 6-7 days/week)
                  </button>
                  <button
                    className={`w-full rounded-md px-4 py-2 hover:rounded-none hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-teal-700`}
                    onClick={() => handleFitnessLevelChange('veryActive')}
                  >
                    Very Active (Exercise multiple times per day)
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="dietGoal" className="mb-2 block">
              Diet Goal
            </label>
            <input
              type="text"
              name="dietGoal"
              value={formData.dietGoal}
              placeholder="Enter your diet goal"
              className="w-full rounded-lg  border px-4 py-2 outline-none transition-colors ease-in-out placeholder:text-gray-300/40 focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700"
              onChange={handleFormChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lifeStage" className="mb-2 block">
              Life Stage
            </label>
            <input
              type="text"
              name="lifeStage"
              value={formData.lifeStage}
              placeholder="Ex. Pregnancy, Elderly, Menstrual Period, Nursing"
              className="w-full rounded-lg  border px-4 py-2 outline-none transition-colors ease-in-out placeholder:text-gray-300/40 focus:ring-2 focus:ring-teal-700 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-teal-700"
              onChange={handleFormChange}
            />
          </div>

          <div className="m space-y-1">
            <p className="text-center text-xs text-gray-300/80">
              Your data is safe and only stored on your device
            </p>
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                id="rememberData"
                name="rememberData"
                checked={rememberData}
                onChange={handleRememberDataChange}
                className="sr-only mr-2" // Hide the default checkbox
              />
              <label
                htmlFor="rememberData"
                className={`relative mr-2 size-4 cursor-pointer rounded-[0.18rem] border border-teal-500 ${
                  rememberData ? 'bg-teal-500' : 'bg-transparent'
                }`}
              >
                {rememberData && (
                  <svg
                    className="absolute left-1/2 top-1/2 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="currentColor"
                      d="M9 16.2l-4.6-4.6 1.4-1.4 3.2 3.2 7.2-7.2 1.4 1.4-8.6 8.6z"
                    />
                  </svg>
                )}
              </label>
              <button
                onClick={handleRememberDataChange}
                className="text-teal-400"
              >
                Remember my data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default HomePage
