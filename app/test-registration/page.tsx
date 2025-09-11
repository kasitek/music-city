"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerUser } from "@/lib/ic/backend"
import { resetActor } from "@/lib/ic/backend"

export default function TestRegistrationPage() {
  const [result, setResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    displayName: "TestUser" + Math.floor(Math.random() * 1000),
    bio: "Test bio",
    location: "Test City",
    genres: ["Pop", "Rock"],
  })

  const testAnonymousRegistration = async () => {
    setIsLoading(true)
    setResult("Testing anonymous registration...")
    
    try {
      // Reset any cached actor
      resetActor()
      
      console.log("Starting anonymous registration test...")
      const res = await registerUser({
        displayName: formData.displayName,
        userType: { fan: null },
        bio: formData.bio,
        location: formData.location,
        genres: formData.genres,
        profileImage: "/test.jpg",
        birthDate: "1990-01-01",
      })
      
      console.log("Registration result:", res)
      setResult(`Success: ${JSON.stringify(res, null, 2)}`)
    } catch (error: any) {
      console.error("Registration error:", error)
      setResult(`Error: ${error.message}\n\nFull error: ${JSON.stringify(error, null, 2)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Registration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({...prev, displayName: e.target.value}))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="bio" className="text-gray-300">Bio</Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="location" className="text-gray-300">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Button 
              onClick={testAnonymousRegistration}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? "Testing..." : "Test Anonymous Registration"}
            </Button>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-700 rounded border">
                <h3 className="text-white font-semibold mb-2">Result:</h3>
                <pre className="text-green-400 whitespace-pre-wrap text-sm overflow-auto">
                  {result}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}