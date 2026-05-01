import {
  Flame,
  ImagePlus,
  Percent,
  Swords,
  Trophy,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/use-auth";

interface ProfileStats {
  bestStreak: number;
  gamesPlayed: number;
  losses: number;
  winRate: number;
  wins: number;
}

interface RecentGame {
  id: number;
  players: number;
  result: "win" | "loss";
  time: string;
}

interface ProfileResponse {
  recentGames?: RecentGame[];
  stats?: ProfileStats;
  success?: boolean;
  user?: {
    createdAt?: string | null;
    id: number;
    lastGameAt?: string | null;
    username: string;
    avatarColor: string;
    avatarUrl?: string | null;
  };
}

const AVATAR_COLORS = [
  { value: "#a855f7", label: "Purple" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#f97316", label: "Orange" },
  { value: "#ec4899", label: "Pink" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f59e0b", label: "Amber" },
];

const EMPTY_STATS: ProfileStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  bestStreak: 0,
};
const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0]?.value ?? "#a855f7";
const CROPPER_SIZE_PX = 320;
const CROPPED_AVATAR_SIZE_PX = 512;

interface CropBounds {
  x: number;
  y: number;
}

interface ImageDimensions {
  height: number;
  width: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

function readImageDimensions(imageSrc: string) {
  return new Promise<ImageDimensions>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = imageSrc;
  });
}

function getMinimumZoom(imageDimensions: ImageDimensions) {
  return Math.max(
    CROPPER_SIZE_PX / imageDimensions.width,
    CROPPER_SIZE_PX / imageDimensions.height
  );
}

function getCenteredCropBounds(
  imageDimensions: ImageDimensions,
  zoom: number
): CropBounds {
  const renderedWidth = imageDimensions.width * zoom;
  const renderedHeight = imageDimensions.height * zoom;

  return {
    x: (CROPPER_SIZE_PX - renderedWidth) / 2,
    y: (CROPPER_SIZE_PX - renderedHeight) / 2,
  };
}

function clampCropBounds(
  nextBounds: CropBounds,
  imageDimensions: ImageDimensions,
  zoom: number
) {
  const renderedWidth = imageDimensions.width * zoom;
  const renderedHeight = imageDimensions.height * zoom;

  return {
    x: clamp(nextBounds.x, CROPPER_SIZE_PX - renderedWidth, 0),
    y: clamp(nextBounds.y, CROPPER_SIZE_PX - renderedHeight, 0),
  };
}

async function createCroppedAvatarFile({
  file,
  imageSrc,
  cropBounds,
  zoom,
}: {
  cropBounds: CropBounds;
  file: File;
  imageSrc: string;
  zoom: number;
}) {
  const image = new Image();
  image.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to render cropped image"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = CROPPED_AVATAR_SIZE_PX;
  canvas.height = CROPPED_AVATAR_SIZE_PX;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is unavailable");
  }

  const sourceX = -cropBounds.x / zoom;
  const sourceY = -cropBounds.y / zoom;
  const sourceSize = CROPPER_SIZE_PX / zoom;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    CROPPED_AVATAR_SIZE_PX,
    CROPPED_AVATAR_SIZE_PX
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
        return;
      }

      reject(new Error("Failed to create cropped avatar"));
    }, file.type || "image/png");
  });

  return new File([blob], file.name, {
    type: blob.type || file.type || "image/png",
    lastModified: Date.now(),
  });
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, getProfileData, updateAvatarColor, uploadAvatar, isGuest } =
    useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAvatarColor, setSelectedAvatarColor] = useState(
    user?.avatarColor ?? DEFAULT_AVATAR_COLOR
  );
  const [isSavingAvatarColor, setIsSavingAvatarColor] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropBounds, setCropBounds] = useState<CropBounds>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<{
    originBounds: CropBounds;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";
  const memberSince = data?.user?.createdAt
    ? new Date(data.user.createdAt).toLocaleDateString()
    : "Unknown";
  const lastPlayed = data?.user?.lastGameAt
    ? new Date(data.user.lastGameAt).toLocaleString()
    : "No games recorded";
  const avatarUrl = data?.user?.avatarUrl ?? user?.avatarUrl ?? null;

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    getProfileData(user.username)
      .then((response) => {
        const profileResponse = response as ProfileResponse;

        if (profileResponse.success) {
          setData(profileResponse);
          setSelectedAvatarColor(
            profileResponse.user?.avatarColor ??
              user?.avatarColor ??
              DEFAULT_AVATAR_COLOR
          );
        }
      })
      .catch((error) => console.error("Profile fetch error:", error))
      .finally(() => setLoading(false));
  }, [getProfileData, user]);

  useEffect(() => {
    return () => {
      if (cropPreviewUrl) {
        URL.revokeObjectURL(cropPreviewUrl);
      }
    };
  }, [cropPreviewUrl]);

  if (loading) {
    return <div className="p-10 text-white">Loading stats...</div>;
  }

  const stats = data?.stats ?? EMPTY_STATS;
  const recentGames = data?.recentGames ?? [];

  async function handleAvatarColorSelect(avatarColor: string) {
    if (!user || isSavingAvatarColor || avatarColor === selectedAvatarColor) {
      return;
    }

    const previousAvatarColor = selectedAvatarColor;
    setSelectedAvatarColor(avatarColor);
    setIsSavingAvatarColor(true);

    const success = await updateAvatarColor(avatarColor);

    if (success) {
      setData((currentData) =>
        currentData
          ? {
              ...currentData,
              user: currentData.user
                ? { ...currentData.user, avatarColor }
                : {
                    id: user.id,
                    username: user.username,
                    avatarColor,
                  },
            }
          : currentData
      );
      toast.success("Avatar color updated");
    } else {
      setSelectedAvatarColor(previousAvatarColor);
    }

    setIsSavingAvatarColor(false);
  }

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file || isUploadingAvatar) {
      return;
    }

    const nextPreviewUrl = getObjectUrl(file);

    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    try {
      const nextImageDimensions = await readImageDimensions(nextPreviewUrl);
      const nextMinZoom = getMinimumZoom(nextImageDimensions);
      const nextCropBounds = getCenteredCropBounds(
        nextImageDimensions,
        nextMinZoom
      );

      setSelectedAvatarFile(file);
      setCropPreviewUrl(nextPreviewUrl);
      setImageDimensions(nextImageDimensions);
      setMinZoom(nextMinZoom);
      setZoom(nextMinZoom);
      setCropBounds(nextCropBounds);
      setIsCropDialogOpen(true);
    } catch (error) {
      URL.revokeObjectURL(nextPreviewUrl);
      toast.error("Couldn't load that image");
      console.error("Avatar preview error:", error);
    }

    event.target.value = "";
  }

  function closeCropDialog() {
    if (cropPreviewUrl) {
      URL.revokeObjectURL(cropPreviewUrl);
    }

    setIsCropDialogOpen(false);
    setSelectedAvatarFile(null);
    setCropPreviewUrl(null);
    setImageDimensions(null);
    setCropBounds({ x: 0, y: 0 });
    setZoom(1);
    setMinZoom(1);
    dragStateRef.current = null;
  }

  async function handleCroppedAvatarUpload() {
    const cropSelection =
      selectedAvatarFile && cropPreviewUrl && imageDimensions
        ? {
            file: selectedAvatarFile,
            imageSrc: cropPreviewUrl,
          }
        : null;

    if (!cropSelection || isUploadingAvatar) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const croppedFile = await createCroppedAvatarFile({
        file: cropSelection.file,
        imageSrc: cropSelection.imageSrc,
        cropBounds,
        zoom,
      });

      const success = await uploadAvatar(croppedFile);

      if (success) {
        const refreshedProfile = (await getProfileData(
          user?.username ?? ""
        )) as ProfileResponse;

        if (refreshedProfile.success) {
          setData(refreshedProfile);
        }

        toast.success("Profile image updated");
        closeCropDialog();
      }
    } catch (error) {
      toast.error("Couldn't crop that image");
      console.error("Avatar crop error:", error);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function handleCropPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!imageDimensions) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originBounds: cropBounds,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCropPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!(dragStateRef.current && imageDimensions)) {
      return;
    }

    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    setCropBounds(
      clampCropBounds(
        {
          x: dragStateRef.current.originBounds.x + deltaX,
          y: dragStateRef.current.originBounds.y + deltaY,
        },
        imageDimensions,
        zoom
      )
    );
  }

  function handleCropPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleZoomChange([nextZoom]: number[]) {
    if (!imageDimensions || typeof nextZoom !== "number") {
      return;
    }

    const centerX = CROPPER_SIZE_PX / 2;
    const centerY = CROPPER_SIZE_PX / 2;
    const imageCenterX = centerX - cropBounds.x;
    const imageCenterY = centerY - cropBounds.y;
    const ratio = nextZoom / zoom;

    setZoom(nextZoom);
    setCropBounds(
      clampCropBounds(
        {
          x: centerX - imageCenterX * ratio,
          y: centerY - imageCenterY * ratio,
        },
        imageDimensions,
        nextZoom
      )
    );
  }

  return (
    <>
      <div className="mx-auto flex min-h-[calc(100svh-74px)] w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between py-2">
          <button
            className="text-sm text-white/40 transition-colors hover:text-white/70"
            onClick={() => navigate("/")}
            type="button"
          >
            {"<- Back"}
          </button>
          <h1 className="font-bold text-sm text-white/60 uppercase tracking-widest">
            Profile
          </h1>
          <div className="w-10" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <Card className="border-white/10 bg-zinc-800/80">
              <CardContent className="space-y-6 pt-8">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div
                    className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full font-bold text-3xl text-white shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
                    style={{ backgroundColor: selectedAvatarColor }}
                  >
                    {avatarUrl ? (
                      <div
                        aria-label={`${user?.username ?? "User"} avatar`}
                        className="h-full w-full rounded-full bg-center bg-cover"
                        role="img"
                        style={{ backgroundImage: `url(${avatarUrl})` }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-2xl text-white">
                      {user?.username ?? "Guest"}
                    </p>
                    <p className="text-sm text-white/45">
                      Member since {memberSince}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/8 bg-zinc-900/60 px-4 py-4">
                    <p className="font-bold text-sm text-white">Record</p>
                    <p className="mt-1 text-sm text-white/45">
                      {stats.wins}W - {stats.losses}L
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-zinc-900/60 px-4 py-4">
                    <p className="font-bold text-sm text-white">Last played</p>
                    <p className="mt-1 text-sm text-white/45">{lastPlayed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-sm text-white/60 uppercase tracking-widest">
                  Profile image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <Button
                  className="h-11 w-full justify-center gap-2 bg-white text-black hover:bg-white/90"
                  disabled={isGuest || isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <ImagePlus className="h-4 w-4" />
                  {isUploadingAvatar ? "Uploading..." : "Upload and crop"}
                </Button>
                <p className="text-sm text-white/45">
                  Drag, zoom, and crop before saving. PNG, JPG, WEBP, GIF up to
                  5MB.
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-sm text-white/60 uppercase tracking-widest">
                  Avatar color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      aria-label={color.label}
                      aria-pressed={selectedAvatarColor === color.value}
                      className={`h-11 w-11 rounded-full transition-transform focus:outline-none focus:ring-2 focus:ring-white/40 ${
                        selectedAvatarColor === color.value
                          ? "scale-110 ring-2 ring-white"
                          : "hover:scale-110"
                      }`}
                      key={color.label}
                      onClick={() => {
                        handleAvatarColorSelect(color.value);
                      }}
                      style={{ backgroundColor: color.value }}
                      type="button"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <Card className="border-white/10 bg-zinc-800/80">
                <CardContent className="flex flex-col items-center gap-1 pt-6 pb-5">
                  <Swords className="h-5 w-5 text-white/30" />
                  <p className="font-black text-3xl text-white">
                    {stats.gamesPlayed}
                  </p>
                  <p className="text-white/40 text-xs">Games played</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-800/80">
                <CardContent className="flex flex-col items-center gap-1 pt-6 pb-5">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <p className="font-black text-3xl text-amber-400">
                    {stats.wins}
                  </p>
                  <p className="text-white/40 text-xs">Wins</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-800/80">
                <CardContent className="flex flex-col items-center gap-1 pt-6 pb-5">
                  <Percent className="h-5 w-5 text-white/30" />
                  <p className="font-black text-3xl text-white">
                    {stats.winRate}%
                  </p>
                  <p className="text-white/40 text-xs">Win rate</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-800/80">
                <CardContent className="flex flex-col items-center gap-1 pt-6 pb-5">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <p className="font-black text-3xl text-orange-400">
                    {stats.bestStreak}
                  </p>
                  <p className="text-white/40 text-xs">Best streak</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-zinc-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="font-bold text-sm text-white/60 uppercase tracking-widest">
                  Recent games
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-2">
                {recentGames.map((game) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-zinc-900/60 px-4 py-4"
                    key={game.id}
                  >
                    <div>
                      <p className="font-bold text-sm text-white">
                        {game.players}-player lobby
                      </p>
                      <p className="mt-1 text-white/40 text-xs">{game.time}</p>
                    </div>
                    <span
                      className={`rounded-md px-3 py-1 font-bold text-xs ${
                        game.result === "win"
                          ? "bg-teal-500/20 text-teal-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {game.result === "win" ? "Win" : "Loss"}
                    </span>
                  </div>
                ))}
                {recentGames.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 border-dashed bg-zinc-900/40 px-5 py-12 text-center text-sm text-white/40 lg:col-span-2">
                    No recent games yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeCropDialog();
          }
        }}
        open={isCropDialogOpen}
      >
        <DialogContent className="max-w-3xl border-white/10 bg-zinc-900 p-0 text-white sm:max-w-3xl">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-white">Crop profile image</DialogTitle>
            <DialogDescription className="text-white/50">
              Drag the image and use zoom to frame the part you want.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 px-6 pb-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <div
                className="relative mx-auto h-[320px] w-[320px] cursor-grab overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 active:cursor-grabbing"
                onPointerCancel={handleCropPointerUp}
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
              >
                {cropPreviewUrl && imageDimensions ? (
                  <div
                    className="absolute inset-0 bg-no-repeat"
                    style={{
                      backgroundImage: `url(${cropPreviewUrl})`,
                      backgroundPosition: `${cropBounds.x}px ${cropBounds.y}px`,
                      backgroundSize: `${imageDimensions.width * zoom}px ${
                        imageDimensions.height * zoom
                      }px`,
                    }}
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-black/35" />
                <div className="pointer-events-none absolute inset-[18px] rounded-full border border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.38)]" />
                <div className="pointer-events-none absolute inset-[18px] rounded-full ring-1 ring-white/20" />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-800/80 px-4 py-4">
                <ZoomIn className="h-4 w-4 shrink-0 text-white/60" />
                <Slider
                  max={Math.max(minZoom * 3, minZoom + 2)}
                  min={minZoom}
                  onValueChange={handleZoomChange}
                  step={0.01}
                  value={[zoom]}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-zinc-800/70 p-4">
                <p className="font-bold text-sm text-white">Preview</p>
                <p className="mt-1 text-white/45 text-xs">
                  This is roughly how it will look in the app.
                </p>
                <div
                  className="mx-auto mt-5 h-32 w-32 rounded-full border border-white/10 bg-zinc-950 bg-no-repeat shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
                  style={{
                    backgroundImage: cropPreviewUrl
                      ? `url(${cropPreviewUrl})`
                      : undefined,
                    backgroundPosition: `${cropBounds.x}px ${cropBounds.y}px`,
                    backgroundSize:
                      imageDimensions && cropPreviewUrl
                        ? `${imageDimensions.width * zoom}px ${
                            imageDimensions.height * zoom
                          }px`
                        : undefined,
                  }}
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-zinc-800/70 p-4 text-sm text-white/55">
                The saved image is square, so it still works in the in-game
                avatar boxes.
              </div>
            </div>
          </div>

          <DialogFooter className="border-white/10 bg-zinc-950/70">
            <Button onClick={closeCropDialog} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              className="bg-white text-black hover:bg-white/90"
              disabled={isUploadingAvatar}
              onClick={handleCroppedAvatarUpload}
              type="button"
            >
              {isUploadingAvatar ? "Saving..." : "Save avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
