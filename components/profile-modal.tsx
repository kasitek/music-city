"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, MapPin, Music2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/ic/auth-context"

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const router = useRouter()
  const { principalId, sessionData, logout } = useAuth()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                <p className="text-gray-400">View your account and profile details</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            {principalId ? (
              <div className="space-y-6">
                {/* Top section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={sessionData?.profileImage || "/placeholder.svg"} alt={sessionData?.displayName || principalId} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {sessionData?.displayName?.charAt(0)?.toUpperCase() || principalId?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{sessionData?.displayName || principalId}</h3>
                      <Badge className="capitalize bg-purple-600/20 text-purple-300 border-purple-600/30">
                        {sessionData?.userType || "User"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-gray-300 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {(sessionData?.location && sessionData.location.trim()) || "Unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Music2 className="h-3.5 w-3.5" />
                        {Array.isArray(sessionData?.genres) && sessionData.genres.length > 0 ? sessionData.genres[0] : "Music"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> {new Intl.NumberFormat().format(sessionData?.mccBalance || 0)} MCC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {sessionData?.bio && (
                  <div>
                    <h4 className="text-white font-medium mb-1">Bio</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">{sessionData.bio}</p>
                  </div>
                )}

                {/* Genres */}
                {Array.isArray(sessionData?.genres) && sessionData.genres.length ? (
                  <div>
                    <h4 className="text-white font-medium mb-2">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {sessionData.genres.map((g) => (
                        <Badge key={g} className="bg-gray-700 border-gray-600 text-gray-200">{g}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-gray-700/50 border border-gray-700">
                    <div className="text-gray-400">Followers</div>
                    <div className="text-white font-semibold">{new Intl.NumberFormat().format(sessionData?.followers || 0)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700/50 border border-gray-700">
                    <div className="text-gray-400">Following</div>
                    <div className="text-white font-semibold">{new Intl.NumberFormat().format(sessionData?.following || 0)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-gray-400">
                    Joined {new Date(sessionData?.joinedDate || Date.now()).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent" onClick={onClose}>
                      Close
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { logout(); onClose(); router.push('/') }}>
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-300">No user is currently logged in.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
