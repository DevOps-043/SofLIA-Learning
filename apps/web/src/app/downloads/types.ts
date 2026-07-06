import type { LucideIcon } from 'lucide-react'

export interface DownloadAsset {
  url: string
  size: string
  name: string
}

export interface ReleaseData {
  version: string
  notes: string
  date: string
  assets: {
    windows?: DownloadAsset
    mac?: DownloadAsset
    linux?: DownloadAsset
  }
}

export interface ReleaseChangelog {
  version: string
  notes: string
  date: string
}

export interface ParsedReleaseNotesSection {
  key: string
  label: string
  items: string[]
}

export interface ParsedReleaseNotes {
  releaseTitle: string
  sections: ParsedReleaseNotesSection[]
}

export interface DownloadsRequirement {
  os: string
  min: string
  ram: string
  disk: string
  icon: LucideIcon
  color: string
}

export interface DownloadsStep {
  title: string
  desc: string
  icon: LucideIcon
}

export interface DownloadsFeature {
  title: string
  desc: string
  icon: LucideIcon
}

export interface GithubReleaseAssetPayload {
  name: string
  size: number
  browser_download_url: string
}

export interface GithubReleasePayload {
  tag_name: string
  body?: string
  published_at?: string
  created_at?: string
  assets?: GithubReleaseAssetPayload[]
}
