import React, { useState } from 'react';
import { UniformatSelector, UniformatDropdown } from './uniformat-selector';
import { UniformatElement, getElementByCode } from '@/data/uniformat-codes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Example form for building component assessment
export function BuildingComponentForm() {
  const [formData, setFormData] = useState({
    uniformatCode: '',
    componentName: '',
    condition: '',
    notes: '',
    estimatedCost: '',
  });
  
  const [selectedElement, setSelectedElement] = useState<UniformatElement | null>(null);

  const handleUniformatChange = (code: string, element: UniformatElement) => {
    setFormData({ ...formData, uniformatCode: code });
    setSelectedElement(element);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    console.log('Selected Uniformat element:', selectedElement);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Building Component Assessment</CardTitle>
        <CardDescription>
          Select a Uniformat code and assess the building component
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Uniformat Code Selection */}
          <div className="space-y-2">
            <Label htmlFor="uniformat">Uniformat Building Element</Label>
            <UniformatSelector
              value={formData.uniformatCode}
              onChange={handleUniformatChange}
              showUsefulLife={true}
            />
          </div>

          {/* Display selected element info */}
          {selectedElement && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Badge>{selectedElement.code}</Badge>
                <span className="font-medium">{selectedElement.name}</span>
              </div>
              {selectedElement.usefulLife && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Expected useful life: {selectedElement.usefulLife} years
                </div>
              )}
            </div>
          )}

          {/* Component Name */}
          <div className="space-y-2">
            <Label htmlFor="componentName">Component Name/Description</Label>
            <Input
              id="componentName"
              value={formData.componentName}
              onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
              placeholder="e.g., North exterior wall, Main roof system"
            />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <select
              id="condition"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              <option value="">Select condition...</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Assessment Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the condition, deficiencies, and recommendations..."
              rows={4}
            />
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="cost">Estimated Repair/Replacement Cost</Label>
            <Input
              id="cost"
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" className="w-full">
            Save Assessment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// Example of using the dropdown version
export function QuickAssessmentForm() {
  const [components, setComponents] = useState<Array<{
    id: string;
    uniformatCode: string;
    condition: string;
  }>>([]);

  const addComponent = () => {
    setComponents([
      ...components,
      {
        id: Date.now().toString(),
        uniformatCode: '',
        condition: '',
      },
    ]);
  };

  const updateComponent = (id: string, field: string, value: string) => {
    setComponents(
      components.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp
      )
    );
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter((comp) => comp.id !== id));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Quick Building Assessment</CardTitle>
        <CardDescription>
          Add multiple building components for rapid assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {components.map((component) => {
            const element = getElementByCode(component.uniformatCode);
            return (
              <div key={component.id} className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Uniformat Code</Label>
                  <UniformatDropdown
                    value={component.uniformatCode}
                    onChange={(code) => updateComponent(component.id, 'uniformatCode', code)}
                  />
                </div>
                <div className="w-40">
                  <Label>Condition</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={component.condition}
                    onChange={(e) => updateComponent(component.id, 'condition', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                {element && element.usefulLife && (
                  <div className="w-24">
                    <Label>Useful Life</Label>
                    <div className="px-3 py-2 border rounded-md bg-gray-50">
                      {element.usefulLife} yrs
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeComponent(component.id)}
                >
                  Remove
                </Button>
              </div>
            );
          })}
          
          <Button onClick={addComponent} variant="outline" className="w-full">
            + Add Component
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}