"use client"
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import Cookies from "js-cookie"
import io from "socket.io-client"

type NavbarContextType = {
  isLogin: boolean
  notificationCount: number
  handleLogout: () => void
  handleNotificationClick: () => void
  userRole: string
  policeName: string
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const socketRef = useRef(null)
  const [userId, setUserId] = useState("")
  const [userRole, setUserRole] = useState("")
  const [policeName, setPoliceName] = useState("")

  const handleLogout = () => {
    Cookies.remove("sessionToken", { path: "/" })
    setIsLogin(false)
    setNotificationCount(0)
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    if (userRole === "police") {
      window.location.href = "/auth"
    }
  }

  const checkUserLogin = () => {
    const token = Cookies.get("sessionToken")
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]))
        setUserId(decoded.id)
        setUserRole(decoded.role || "user")
        if (decoded.name) {
          setPoliceName(decoded.name)
        }
        setIsLogin(true)
        return true
      } catch (error) {
        console.error("Error decoding token:", error)
        setIsLogin(false)
        return false
      }
    } else {
      setIsLogin(false)
      return false
    }
  }

  const fetchNotificationCount = async () => {
    if (!isLogin) return

    try {
      const endpoint = userRole === "police" 
        ? "/api/police/total-notification-count" 
        : "/api/notifications/count"
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setNotificationCount(data.count)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  const initializeSocket = () => {
    if (!socketRef.current && isLogin && userId) {
      const socket = io()

      socket.on("connect", () => {
        socket.emit("authenticate", userId)
      })

      socket.on("notification", (data) => {
        if (data.userId === userId) {
          if (userRole === "police") {
            fetchNotificationCount()
          } else {
            setNotificationCount((prev) => prev + 1)
          }
        }
      })

      socketRef.current = socket
    }
  }

  const handleNotificationClick = () => {
    if (!isLogin) return
    
    const notificationsPath = userRole === "police" 
      ? "/police/notifications" 
      : "/notifications"
    
    window.location.href = notificationsPath
  }

  useEffect(() => {
    const isUserLoggedIn = checkUserLogin()
    if (isUserLoggedIn) {
      fetchNotificationCount()
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isLogin && userId) {
      initializeSocket()
    }
  }, [isLogin, userId])

  useEffect(() => {
    if (isLogin && userId) {
      fetchNotificationCount()
    }
  }, [userRole, isLogin, userId])

  useEffect(() => {
    const handleUpdateNotificationCount = (event: any) => {
      setNotificationCount(event.detail.count)
    }

    window.addEventListener("updateNotificationCount", handleUpdateNotificationCount)

    return () => {
      window.removeEventListener("updateNotificationCount", handleUpdateNotificationCount)
    }
  }, [])

  const value = {
    isLogin,
    notificationCount,
    handleLogout,
    handleNotificationClick,
    userRole,
    policeName
  }

  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
}

export function useNavbar() {
  const context = useContext(NavbarContext)
  if (context === undefined) {
    throw new Error("useNavbar must be used within a NavbarProvider")
  }
  return context
}