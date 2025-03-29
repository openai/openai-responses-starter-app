import { ExternalLinkIcon, FileText } from "lucide-react";
import logger from "@/lib/logger";
import { useEffect } from "react";

export type Annotation = {
    type: "file_citation" | "url_citation";
    fileId?: string;
    url?: string;
    title?: string;
    filename?: string;
    index?: number;
    // Pola dla formatu Responses API
    url_citation?: {
        url: string;
        title: string;
        start_index?: number;
        end_index?: number;
    };
    file_citation?: {
        file_id: string;
        filename: string;
        start_index?: number;
        end_index?: number;
    };
};

/**
 * Komponent AnnotationPill - wyświetla pojedynczą adnotację
 */
const AnnotationPill = ({ annotation }: { annotation: Annotation }) => {
    const className =
        "inline-block text-nowrap px-3 py-1 rounded-full text-xs max-w-48 shrink-0 text-ellipsis overflow-hidden bg-[#ededed] text-zinc-500 hover:bg-gray-200 transition-colors";

    useEffect(() => {
        logger.info("ANNOTATION_PILL", `Renderowanie adnotacji typu: ${annotation.type}`);
    }, [annotation]);

    if (!annotation || !annotation.type) {
        logger.warn("ANNOTATION_PILL", `Nieprawidłowa adnotacja: ${JSON.stringify(annotation)}`);
        return null;
    }

    // Normalizacja danych adnotacji dla spójnego wyświetlania niezależnie od źródła (Responses API vs Chat Completions)
    const normalizeAnnotation = (annotation: Annotation) => {
        if (annotation.type === "url_citation") {
            // Dla adnotacji URL
            if (annotation.url_citation) {
                // Format Responses API
                return {
                    url: annotation.url_citation.url,
                    title: annotation.url_citation.title || annotation.url_citation.url
                };
            } else {
                // Format Chat Completions API
                return {
                    url: annotation.url || "#",
                    title: annotation.title || annotation.url || "Link"
                };
            }
        } else if (annotation.type === "file_citation") {
            // Dla adnotacji plików
            if (annotation.file_citation) {
                // Format Responses API
                return {
                    fileId: annotation.file_citation.file_id,
                    filename: annotation.file_citation.filename || "Plik"
                };
            } else {
                // Format Chat Completions API
                return {
                    fileId: annotation.fileId || "",
                    filename: annotation.filename || "Plik"
                };
            }
        }
        // Domyślne wartości
        return { title: "Nieznany format", url: "#", fileId: "", filename: "Plik" };
    };

    const normalizedData = normalizeAnnotation(annotation);

    switch (annotation.type) {
        case "file_citation":
            return (
                <span className={className}>
                    <div className="flex items-center gap-1">
                        <FileText size={12} className="shrink-0" />
                        <div className="truncate">{normalizedData.filename}</div>
                    </div>
                </span>
            );
        case "url_citation":
            return (
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={normalizedData.url}
                    className={className}
                >
                    <div className="flex items-center gap-1">
                        <div className="truncate min-w-0">{normalizedData.title}</div>
                        <ExternalLinkIcon size={12} className="shrink-0 ml-1" />
                    </div>
                </a>
            );
        default:
            logger.warn("ANNOTATION_PILL", `Nieznany typ adnotacji: ${annotation.type}`);
            return <span className={className}>Nieznana adnotacja</span>;
    }
};

/**
 * Komponent Annotations - wyświetla listę adnotacji
 */
const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
    useEffect(() => {
        if (annotations && annotations.length > 0) {
            logger.info("ANNOTATIONS", `Otrzymano ${annotations.length} adnotacji do wyrenderowania`);
        }
    }, [annotations]);

    if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
        return null;
    }

    // Funkcja porównująca adnotacje dla usuwania duplikatów
    const compareAnnotations = (a: Annotation, b: Annotation) => {
        if (a.type !== b.type) return false;

        if (a.type === "file_citation") {
            const aFileId = a.file_citation?.file_id || a.fileId;
            const bFileId = b.file_citation?.file_id || b.fileId;
            return aFileId === bFileId;
        } else if (a.type === "url_citation") {
            const aUrl = a.url_citation?.url || a.url;
            const bUrl = b.url_citation?.url || b.url;
            return aUrl === bUrl;
        }

        return false;
    };

    // Filtrowanie unikalnych adnotacji
    const uniqueAnnotations = annotations.reduce(
        (acc: Annotation[], annotation) => {
            if (!acc.some(a => compareAnnotations(a, annotation))) {
                acc.push(annotation);
            }
            return acc;
        },
        []
    );

    logger.info("ANNOTATIONS", `Po filtrowaniu dublikatów pozostało ${uniqueAnnotations.length} adnotacji`);

    return (
        <div className="flex max-w-full mr-28 ml-4 overflow-x-auto gap-2 mb-2 py-1">
            {uniqueAnnotations.map((annotation: Annotation, index: number) => (
                <AnnotationPill key={index} annotation={annotation} />
            ))}
        </div>
    );
};

export default Annotations;
