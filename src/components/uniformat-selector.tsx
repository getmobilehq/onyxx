import React, { useState, useMemo } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import {
  uniformatCodes,
  UniformatElement,
  getMajorGroups,
  getChildElements,
  searchElements,
  getElementHierarchy,
} from '@/data/uniformat-codes';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface UniformatSelectorProps {
  value?: string;
  onChange?: (code: string, element: UniformatElement) => void;
  showUsefulLife?: boolean;
  className?: string;
}

export function UniformatSelector({
  value,
  onChange,
  showUsefulLife = true,
  className = '',
}: UniformatSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCode, setSelectedCode] = useState<string | undefined>(value);

  const searchResults = useMemo(() => {
    if (!searchTerm) return null;
    return searchElements(searchTerm);
  }, [searchTerm]);

  const toggleExpanded = (code: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedItems(newExpanded);
  };

  const handleSelect = (element: UniformatElement) => {
    setSelectedCode(element.code);
    onChange?.(element.code, element);
  };

  const renderElement = (element: UniformatElement, depth: number = 0) => {
    const children = getChildElements(element.code);
    const hasChildren = children.length > 0;
    const isExpanded = expandedItems.has(element.code);
    const isSelected = selectedCode === element.code;

    return (
      <div key={element.code} className={`${depth > 0 ? 'ml-4' : ''}`}>
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
            hover:bg-gray-100 dark:hover:bg-gray-800
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          `}
          onClick={() => handleSelect(element)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(element.code);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          <div className="flex-1 flex items-center gap-2">
            <code className="text-sm font-medium">{element.code}</code>
            <span className="text-sm">{element.name}</span>
            {showUsefulLife && element.usefulLife && (
              <Badge variant="secondary" className="text-xs">
                {element.usefulLife} years
              </Badge>
            )}
          </div>
          
          <Badge
            variant={
              element.level === 'major-group'
                ? 'default'
                : element.level === 'group'
                ? 'secondary'
                : 'outline'
            }
            className="text-xs"
          >
            {element.level}
          </Badge>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map((child) => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedHierarchy = useMemo(() => {
    if (!selectedCode) return [];
    return getElementHierarchy(selectedCode);
  }, [selectedCode]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search by code or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Path */}
      {selectedHierarchy.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
          <div className="text-xs text-gray-500 mb-1">Selected:</div>
          <div className="flex items-center gap-1 flex-wrap">
            {selectedHierarchy.map((element, index) => (
              <React.Fragment key={element.code}>
                {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                <Badge variant="outline" className="text-xs">
                  {element.code} - {element.name}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Tree or Search Results */}
      <ScrollArea className="h-[400px] border rounded-md p-2">
        {searchResults ? (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 mb-2">
              {searchResults.length} results found
            </div>
            {searchResults.map((element) => (
              <div
                key={element.code}
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  ${selectedCode === element.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onClick={() => handleSelect(element)}
              >
                <code className="text-sm font-medium">{element.code}</code>
                <span className="text-sm">{element.name}</span>
                {showUsefulLife && element.usefulLife && (
                  <Badge variant="secondary" className="text-xs">
                    {element.usefulLife} years
                  </Badge>
                )}
                <Badge
                  variant={
                    element.level === 'major-group'
                      ? 'default'
                      : element.level === 'group'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="text-xs ml-auto"
                >
                  {element.level}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {getMajorGroups().map((majorGroup) => renderElement(majorGroup))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Export a simple dropdown version
export function UniformatDropdown({
  value,
  onChange,
  className = '',
}: {
  value?: string;
  onChange?: (code: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedElement = value ? uniformatCodes.find(e => e.code === value) : null;

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        {selectedElement ? (
          <span>
            <code className="font-medium">{selectedElement.code}</code> - {selectedElement.name}
          </span>
        ) : (
          <span className="text-gray-500">Select Uniformat code...</span>
        )}
        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border rounded-md shadow-lg">
          <UniformatSelector
            value={value}
            onChange={(code) => {
              onChange?.(code);
              setIsOpen(false);
            }}
            className="p-4"
          />
        </div>
      )}
    </div>
  );
}