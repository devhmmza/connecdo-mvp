'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  User, 
  LogOut, 
  Home, 
  Plus, 
  Settings, 
  Bug, 
  Lightbulb, 
  Code, 
  Heart, 
  MessageCircle, 
  Users,
  Moon,
  Sun,
  Zap,
  Target,
  Rocket,
  ArrowRight,
  Github,
  Twitter,
  Mail,
  DollarSign,
  Trophy,
  Search,
  Filter,
  Calendar,
  Tag,
  ExternalLink
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'

export default function ConnecdoApp() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('signin')
  const [currentView, setCurrentView] = useState('landing')
  const [problems, setProblems] = useState([])
  const [userProblems, setUserProblems] = useState([])
  const [solutions, setSolutions] = useState([])
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [newProblem, setNewProblem] = useState({ title: '', description: '', tags: '' })
  const [profileData, setProfileData] = useState({ username: '', role: '', bio: '' })
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '' })
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [newSolution, setNewSolution] = useState({ description: '', solution_url: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState('newest')
  
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchUserProfile(session.user.id)
        setCurrentView('dashboard')
      }
      setLoading(false)
    }
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          setCurrentView('dashboard')
        } else {
          setUser(null)
          setCurrentView('landing')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          setShowProfileSetup(true)
        } else {
          console.error('Error fetching user profile:', error)
        }
      } else if (data) {
        setProfileData(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Fetch problems
  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select(`
          *,
          users!problems_posted_by_fkey (username, email),
          solutions (id, builder_id)
        `)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setProblems(data)
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
    }
  }

  // Fetch user's problems
  const fetchUserProblems = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('problems')
        .select(`
          *,
          solutions (id, builder_id, description, solution_url)
        `)
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setUserProblems(data)
      }
    } catch (error) {
      console.error('Error fetching user problems:', error)
    }
  }

  // Authentication handlers
  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: authData.email,
        password: authData.password
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Signed in successfully!')
      }
    } catch (error) {
      toast.error('Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (authData.password !== authData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Account created! Please check your email for verification.')
        setAuthMode('signin')
      }
    } catch (error) {
      toast.error('Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCurrentView('landing')
    toast.success('Signed out successfully')
  }

  // Profile setup
  const handleProfileSetup = async (e) => {
    e.preventDefault()
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          username: profileData.username,
          role: profileData.role,
          bio: profileData.bio,
          created_at: new Date().toISOString()
        }])
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Profile setup complete!')
        setShowProfileSetup(false)
      }
    } catch (error) {
      toast.error('Profile setup failed')
    }
  }

  // Problem posting
  const handlePostProblem = async (e) => {
    e.preventDefault()
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('problems')
        .insert([{
          title: newProblem.title,
          description: newProblem.description,
          tags: newProblem.tags.split(',').map(tag => tag.trim()),
          posted_by: user.id,
          created_at: new Date().toISOString()
        }])
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Problem posted successfully!')
        setNewProblem({ title: '', description: '', tags: '' })
        fetchProblems()
        fetchUserProblems()
      }
    } catch (error) {
      toast.error('Failed to post problem')
    }
  }

  // Solution posting
  const handlePostSolution = async (e) => {
    e.preventDefault()
    if (!user || !selectedProblem) return
    
    try {
      const { error } = await supabase
        .from('solutions')
        .insert([{
          problem_id: selectedProblem.id,
          builder_id: user.id,
          description: newSolution.description,
          solution_url: newSolution.solution_url,
          created_at: new Date().toISOString()
        }])
      
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Solution posted successfully!')
        setNewSolution({ description: '', solution_url: '' })
        setSelectedProblem(null)
        fetchProblems()
      }
    } catch (error) {
      toast.error('Failed to post solution')
    }
  }

  // Landing page component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Connecdo
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('auth')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Where Problems Meet Solutions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect real-world problems with talented builders. Post your ideas, find solutions, and build the future together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              onClick={() => setCurrentView('auth')}
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Post a Problem
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('auth')}
            >
              <Code className="w-5 h-5 mr-2" />
              Build a Solution
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="text-center">
              <CardHeader>
                <Target className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <CardTitle>Post Problems</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Share your ideas and problems with a community of builders ready to help.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="text-center">
              <CardHeader>
                <Rocket className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                <CardTitle>Build Solutions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Find interesting problems and showcase your skills by building solutions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <CardTitle>Connect & Collaborate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Build meaningful connections with like-minded creators and innovators.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold">Connecdo</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/devhmmza" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://twitter.com/PyHamza" target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="mailto:hmmza.py@gmail.com">
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 Connecdo. Connecting ideas with builders.
          </div>
        </div>
      </footer>
    </div>
  )

  // Authentication component
  const AuthPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {authMode === 'signin' ? 'Welcome Back' : 'Join Connecdo'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signin' 
                ? 'Sign in to your account' 
                : 'Create your account to get started'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={authData.email}
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  required
                />
              </div>
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={authData.confirmPassword}
                    onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setCurrentView('landing')}
              >
                ← Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Profile setup component
  const ProfileSetupPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Let's set up your profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I am a...</Label>
                <Select value={profileData.role} onValueChange={(value) => setProfileData({...profileData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poster">Poster (I have problems/ideas)</SelectItem>
                    <SelectItem value="builder">Builder (I build solutions)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full">
                Complete Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Dashboard component
  const Dashboard = () => {
    const isPoster = profileData.role === 'poster'
    const isBuilder = profileData.role === 'builder'

    useEffect(() => {
      fetchProblems()
      if (isPoster) {
        fetchUserProblems()
      }
    }, [profileData.role])

    const filteredProblems = problems.filter(problem => 
      problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="border-b bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold">Connecdo</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {profileData.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{profileData.username}</div>
                    <div className="text-xs text-gray-500 capitalize">{profileData.role}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setCurrentView('dashboard')}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  {isPoster && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setCurrentView('post-problem')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Post Problem
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setCurrentView('my-problems')}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        My Problems
                      </Button>
                    </>
                  )}
                  {isBuilder && (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setCurrentView('problem-feed')}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Problem Feed
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setCurrentView('my-solutions')}
                      >
                        <Code className="w-4 h-4 mr-2" />
                        My Solutions
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setCurrentView('report-bug')}
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {currentView === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Welcome back, {profileData.username}!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {isPoster 
                        ? "Ready to share your next big idea?" 
                        : "Ready to build something amazing?"
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Lightbulb className="w-5 h-5 mr-2" />
                          Problems
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{problems.length}</div>
                        <p className="text-gray-600 dark:text-gray-300">Total problems posted</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Code className="w-5 h-5 mr-2" />
                          Solutions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{solutions.length}</div>
                        <p className="text-gray-600 dark:text-gray-300">Total solutions built</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Problems</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {problems.slice(0, 3).map((problem) => (
                          <div key={problem.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold">{problem.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {problem.description.substring(0, 100)}...
                                </p>
                                <div className="flex items-center mt-2 space-x-2">
                                  {problem.tags?.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  {problem.solutions?.length || 0} solutions
                                </div>
                                {isBuilder && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => setSelectedProblem(problem)}
                                  >
                                    Build Solution
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentView === 'post-problem' && isPoster && (
                <Card>
                  <CardHeader>
                    <CardTitle>Post a New Problem</CardTitle>
                    <CardDescription>
                      Share your idea or problem with the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePostProblem} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Problem Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter a clear, descriptive title"
                          value={newProblem.title}
                          onChange={(e) => setNewProblem({...newProblem, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your problem in detail..."
                          value={newProblem.description}
                          onChange={(e) => setNewProblem({...newProblem, description: e.target.value})}
                          required
                          rows={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          placeholder="e.g., web, mobile, ai, blockchain"
                          value={newProblem.tags}
                          onChange={(e) => setNewProblem({...newProblem, tags: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Problem
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {currentView === 'my-problems' && isPoster && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">My Problems</h2>
                  </div>
                  <div className="space-y-4">
                    {userProblems.map((problem) => (
                      <Card key={problem.id}>
                        <CardHeader>
                          <CardTitle>{problem.title}</CardTitle>
                          <CardDescription>
                            Posted on {new Date(problem.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {problem.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {problem.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-sm text-gray-500">
                                {problem.solutions?.length || 0} solutions
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                title="Feature coming soon"
                              >
                                <DollarSign className="w-4 h-4 mr-1" />
                                Tip Builder
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'problem-feed' && isBuilder && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Problem Feed</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Search problems..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={filterBy} onValueChange={setFilterBy}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="most-solutions">Most Solutions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredProblems.map((problem) => (
                      <Card key={problem.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle>{problem.title}</CardTitle>
                              <CardDescription>
                                Posted by {problem.users?.username} on{' '}
                                {new Date(problem.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <Button
                              onClick={() => setSelectedProblem(problem)}
                              size="sm"
                            >
                              Build Solution
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {problem.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {problem.tags?.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {problem.solutions?.length || 0} builders
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(problem.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'report-bug' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Report a Bug</CardTitle>
                    <CardDescription>
                      Help us improve Connecdo by reporting issues
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bug-subject">Subject</Label>
                        <Input
                          id="bug-subject"
                          placeholder="Brief description of the issue"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bug-message">Message</Label>
                        <Textarea
                          id="bug-message"
                          placeholder="Please describe the bug in detail..."
                          rows={6}
                        />
                      </div>
                      <Button className="w-full">
                        <Bug className="w-4 h-4 mr-2" />
                        Submit Bug Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Solution posting modal
  const SolutionModal = () => {
    if (!selectedProblem) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Build Solution</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Problem: {selectedProblem.title}
          </p>
          <form onSubmit={handlePostSolution} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solution-description">Solution Description</Label>
              <Textarea
                id="solution-description"
                placeholder="Describe your solution approach..."
                value={newSolution.description}
                onChange={(e) => setNewSolution({...newSolution, description: e.target.value})}
                required
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution-url">Solution URL (optional)</Label>
              <Input
                id="solution-url"
                placeholder="https://github.com/username/repo"
                value={newSolution.solution_url}
                onChange={(e) => setNewSolution({...newSolution, solution_url: e.target.value})}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                Submit Solution
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedProblem(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'auth' && <AuthPage />}
      {showProfileSetup && <ProfileSetupPage />}
      {currentView === 'dashboard' && user && !showProfileSetup && <Dashboard />}
      {currentView === 'post-problem' && user && !showProfileSetup && <Dashboard />}
      {currentView === 'my-problems' && user && !showProfileSetup && <Dashboard />}
      {currentView === 'problem-feed' && user && !showProfileSetup && <Dashboard />}
      {currentView === 'my-solutions' && user && !showProfileSetup && <Dashboard />}
      {currentView === 'report-bug' && user && !showProfileSetup && <Dashboard />}
      {selectedProblem && <SolutionModal />}
    </div>
  )
}