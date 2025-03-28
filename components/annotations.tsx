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
};

const AnnotationPill = ({ annotation }: { annotation: Annotation }) => {
    const className =
        "inline-block text-nowrap px-3 py-1 rounded-full text-xs max-w-48 shrink-0 text-ellipsis overflow-hidden bg-[#ededed] text-zinc-500";

    useEffect(() => {
        logger.info("ANNOTATION_PILL", `Renderowanie adnotacji typu: ${annotation.type}`);
    }, [annotation]);

    if (!annotation || !annotation.type) {
        logger.warn("ANNOTATION_PILL", `Nieprawidłowa adnotacja: ${JSON.stringify(annotation)}`);
        return null;
    }

    switch (annotation.type) {
        case "file_citation":
            return (
                <span className={className}>
                    <div className="flex items-center gap-1">
                        <FileText size={12} className="shrink-0" />
                        <div className="truncate">{annotation.filename || "Plik"}</div>
                    </div>
                </span>
            );
        case "url_citation":
            return (
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={annotation.url_citation?.url}
                    className={className}
                >
                    <div className="flex items-center gap-1">
                        <div className="truncate min-w-0">{annotation.url_citation?.title || annotation.url_citation?.url}</div>
                        <ExternalLinkIcon size={12} className="shrink-0 ml-1" />
                    </div>
                </a>
            );
        default:
            logger.warn("ANNOTATION_PILL", `Nieznany typ adnotacji: ${annotation.type}`);
            return <span className={className}>Nieznana adnotacja</span>;
    }
};

const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
    useEffect(() => {
        if (annotations && annotations.length > 0) {
            logger.info("ANNOTATIONS", `Otrzymano ${annotations.length} adnotacji do wyrenderowania`);
        }
    }, [annotations]);

    if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
        return null;
    }

    const uniqueAnnotations = annotations.reduce(
        (acc: Annotation[], annotation) => {
            if (
                !acc.some(
                    (a: Annotation) =>
                        a.type === annotation.type &&
                        ((annotation.type === "file_citation" &&
                            a.fileId === annotation.fileId) ||
                            (annotation.type === "url_citation" && a.url === annotation.url))
                )
            ) {
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
