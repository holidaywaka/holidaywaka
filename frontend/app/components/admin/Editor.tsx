
import ReactQuill from 'react-quill-new';
import { EditorModules } from '../utils';

type ComponentProps = {
    title: string
    form: string
    onChange: (value: string) => void
    error: string
    modules?: Record<string, unknown>
    formats?: string[]
    placeholder?: string
    className?: string
}

export default function Editor({ title, form, onChange, error, modules = EditorModules, formats, placeholder, className = '' }: ComponentProps) {
    return (
        <div>
            <div className="text-sm">{title}</div>
            <div className={`${error ? 'border-red-600 border' : ''} ${className}`}>
                <ReactQuill
                    modules={modules}
                    formats={formats}
                    placeholder={placeholder}
                    theme="snow"
                    value={form}
                    onChange={onChange} />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div> }
        </div>
    )
}
