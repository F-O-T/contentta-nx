import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface WritersListContextType {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	clearFilters: () => void;
	hasActiveFilters: boolean;
}

const WritersListContext = createContext<WritersListContextType | undefined>(
	undefined,
);

export function WritersListProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [searchTerm, setSearchTerm] = useState("");

	const hasActiveFilters = useMemo(() => {
		return searchTerm.length > 0;
	}, [searchTerm]);

	const clearFilters = useCallback(() => {
		setSearchTerm("");
	}, []);

	const value = {
		clearFilters,
		hasActiveFilters,
		searchTerm,
		setSearchTerm,
	};

	return (
		<WritersListContext.Provider value={value}>
			{children}
		</WritersListContext.Provider>
	);
}

export function useWritersList() {
	const context = useContext(WritersListContext);
	if (context === undefined) {
		throw new Error(
			"useWritersList must be used within a WritersListProvider",
		);
	}
	return context;
}
