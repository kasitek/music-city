"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Music, User, ArrowRight, Upload, X } from "lucide-react"
import { useState, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { mockDB } from "@/lib/mock-database"
import { registerUser as registerUserIC } from "@/lib/ic/backend"
import { getIdentity } from "@/lib/ic/auth"
import { setIdentity as setBackendIdentity } from "@/lib/ic/backend"
import type { Identity } from "@dfinity/agent"

interface OnboardingModalProps {
  walletAddress: string
  onComplete: () => void
  onClose: () => void
}

export default function OnboardingModal({ walletAddress, onComplete, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    userType: "",
    displayName: "",
    bio: "",
    location: "",
    genres: [] as string[],
    birthDate: "",
    profileImage: "",
  })
  const { login, loginWithII } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profileImage: String(reader.result || "") }))
    }
    reader.readAsDataURL(file)
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageFiles(e.target.files)
  }

  const onDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleImageFiles(e.dataTransfer.files)
  }

  const onDragOverImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDragLeaveImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const genres = [
    "Pop",
    "Hip-Hop",
    "R&B",
    "Electronic",
    "Rock",
    "Jazz",
    "Country",
    "Dance",
    "Indie",
    "Trap",
    "Classical",
    "Reggae",
  ]

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
    }))
  }

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Initialize database with sample data
      mockDB.initializeDatabase()

      // Reuse existing user or create one if missing
      const existing = walletAddress ? mockDB.getUserByWallet(walletAddress) : null
      const user = existing
        ? mockDB.updateUser(existing.id, {
            userType: formData.userType as "artist" | "fan",
            displayName: formData.displayName || existing.displayName,
            bio: formData.bio ?? existing.bio,
            location: formData.location || existing.location,
            genres: formData.genres?.length ? formData.genres : existing.genres,
            birthDate: formData.birthDate || existing.birthDate,
            profileImage: formData.profileImage || existing.profileImage,
          }) || existing
        : mockDB.createUser({
            walletAddress,
            userType: formData.userType as "artist" | "fan",
            displayName: formData.displayName,
            bio: formData.bio,
            location: formData.location,
            genres: formData.genres,
            birthDate: formData.birthDate,
            profileImage: formData.profileImage,
            isVerified: false,
          })

      if (user) {
        mockDB.setCurrentUser(user)
      }

      // Register in IC backend so permissions (e.g., createTrack) work under the correct principal
      try {
        // Ensure we have an authenticated identity (avoid registering as Anonymous)
        let id: Identity | null = null
        try { id = getIdentity() } catch {}
        if (!id) {
          try {
            await loginWithII()
            id = getIdentity()
          } catch (e) {
            console.warn("II login skipped/failed; proceeding may register anonymous principal", e)
          }
        }
        if (id) setBackendIdentity(id)
        await registerUserIC({
          displayName: formData.displayName,
          userType: formData.userType === "artist" ? { artist: null } : { fan: null },
          bio: formData.bio,
          location: formData.location,
          genres: formData.genres,
          profileImage: formData.profileImage,
          birthDate: formData.birthDate || null,
        })
        console.log("registerUser (IC) success [modal]")
      } catch (e) {
        console.warn("registerUser (IC) failed [modal]", e)
      }

      // Login the user (this will set the auth context)
      await login(walletAddress)

      // Complete onboarding
      onComplete()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.userType !== ""
      case 2:
        return formData.displayName.trim() !== "" && formData.location.trim() !== ""
      case 3:
        return formData.genres.length > 0
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
                <p className="text-gray-400">Help us personalize your Music City experience</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Step {step} of 3</span>
                <span className="text-sm text-gray-400">{Math.round((step / 3) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: User Type */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">What brings you to Music City?</h2>
                  <p className="text-gray-400">Choose your primary role on the platform</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-colors ${
                      formData.userType === "artist"
                        ? "bg-purple-600/20 border-purple-600"
                        : "bg-gray-700 border-gray-600 hover:border-purple-600/50"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, userType: "artist" }))}
                  >
                    <CardContent className="p-6 text-center">
                      <Music className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">I'm an Artist</h3>
                      <p className="text-sm text-gray-400">Upload music, earn royalties, and connect with fans</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-colors ${
                      formData.userType === "fan"
                        ? "bg-purple-600/20 border-purple-600"
                        : "bg-gray-700 border-gray-600 hover:border-purple-600/50"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, userType: "fan" }))}
                  >
                    <CardContent className="p-6 text-center">
                      <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">I'm a Fan</h3>
                      <p className="text-sm text-gray-400">Discover music, support artists, and collect NFTs</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Tell us about yourself</h2>
                  <p className="text-gray-400">Basic information for your profile</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName" className="text-gray-300">
                      Display Name *
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="How should we call you?"
                      value={formData.displayName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-gray-300">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us a bit about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-gray-300">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={formData.location}
                        onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthDate" className="text-gray-300">
                        Birth Date
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300">Profile Picture</Label>
                    <div
                      className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? "border-purple-500 bg-purple-500/10" : "border-gray-600"
                      }`}
                      onDrop={onDropImage}
                      onDragOver={onDragOverImage}
                      onDragLeave={onDragLeaveImage}
                      role="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.profileImage ? (
                        <div className="space-y-3">
                          <img
                            src={formData.profileImage}
                            alt="Profile preview"
                            className="mx-auto h-28 w-28 rounded-full object-cover border border-gray-600"
                          />
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              className="border-gray-600 text-gray-300 bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                fileInputRef.current?.click()
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              variant="ghost"
                              className="text-red-300 hover:text-red-200"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData((p) => ({ ...p, profileImage: "" }))
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <div className="text-sm text-gray-400">Drop your image here or click to browse</div>
                          <Button
                            variant="outline"
                            className="mt-2 border-gray-600 text-gray-300 bg-transparent"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInputRef.current?.click()
                            }}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onPickImage}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Music Preferences</h2>
                  <p className="text-gray-400">
                    {formData.userType === "artist" ? "What genres do you create?" : "What genres do you enjoy?"}
                  </p>
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block">Select your favorite genres (choose at least one)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className={`cursor-pointer p-3 text-center transition-colors ${
                          formData.genres.includes(genre)
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-600 text-gray-300 hover:border-purple-600"
                        }`}
                        onClick={() => handleGenreToggle(genre)}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {formData.genres.length} genre{formData.genres.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {formData.userType === "artist" && (
                  <div className="p-4 bg-purple-600/20 border border-purple-600/30 rounded-lg">
                    <h3 className="font-semibold text-white mb-2">Artist Benefits</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Upload unlimited tracks</li>
                      <li>• Earn up to 90% royalties</li>
                      <li>• Create and sell NFTs</li>
                      <li>• Direct fan engagement</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
                className="border-gray-600 text-gray-300 bg-transparent"
              >
                Back
              </Button>
              <Button onClick={handleNext} disabled={!isStepValid()} className="bg-purple-600 hover:bg-purple-700">
                {step === 3 ? "Complete Setup" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
