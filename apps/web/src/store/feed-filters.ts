import { create } from 'zustand'

interface FeedFilterState {
    sourceId: string
    setSourceId: (sourceId: string) => void
}

export const useFeedFilterStore = create<FeedFilterState>((set) => ({
    sourceId: 'all',
    setSourceId: (sourceId) => set({ sourceId }),
}))
