
import jsPDF from 'jspdf';
import { GroceryList, GroceryItem, IngredientCategory } from './types';
import { formatQuantity } from './groceryUtils';

// Generate PDF from grocery list
export const generateGroceryListPDF = (groceryList: GroceryList): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set title
  doc.setFontSize(20);
  doc.text(groceryList.name, pageWidth / 2, 20, { align: 'center' });
  
  // Set date range
  doc.setFontSize(12);
  const startDate = new Date(groceryList.start_date);
  const endDate = new Date(groceryList.end_date);
  const dateText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  doc.text(dateText, pageWidth / 2, 30, { align: 'center' });
  
  // Add line
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);
  
  // Group items by category
  const groupedItems = groceryList?.items?.reduce((acc, item) => {
    const category = item.category as IngredientCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<IngredientCategory, GroceryItem[]>) || {} as Record<IngredientCategory, GroceryItem[]>;
  
  // Count items statistics
  const totalItems = groceryList.items.length;
  const checkedItems = groceryList.items.filter(item => item.checked).length;
  
  // Add shopping progress
  doc.setFontSize(11);
  doc.text(`Shopping Progress: ${checkedItems}/${totalItems} items purchased`, pageWidth / 2, 40, { align: 'center' });
  
  // Initialize y position for content
  let yPos = 50;
  
  // Loop through categories
  Object.entries(groupedItems).forEach(([category, items]) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add category header
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(categoryName, 20, yPos);
    yPos += 10;
    
    // Add items in category
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Sort items: unchecked first, then checked
    const sortedItems = [...items].sort((a, b) => {
      if (a.checked && !b.checked) return 1;
      if (!a.checked && b.checked) return -1;
      return 0;
    });
    
    sortedItems.forEach(item => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const checkBox = item.checked ? '☑' : '☐';
      const quantity = `${formatQuantity(item.quantity)} ${item.unit}`;
      
      doc.text(checkBox, 20, yPos);
      
      // Apply strikethrough for checked items
      if (item.checked) {
        doc.setTextColor(128, 128, 128); // Grey color for checked items
      } else {
        doc.setTextColor(0, 0, 0); // Black for unchecked items
      }
      
      doc.text(item.name, 30, yPos);
      doc.text(quantity, pageWidth - 50, yPos);
      
      // Add recipe sources in smaller text
      if (item.recipe_sources.length > 0) {
        doc.setFontSize(8);
        const recipesText = `From: ${item.recipe_sources.join(', ')}`;
        doc.text(recipesText, 30, yPos + 4);
        doc.setFontSize(10);
      }
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      yPos += item.recipe_sources.length > 0 ? 10 : 6;
    });
    
    // Add some space after each category
    yPos += 5;
  });
  
  return doc;
};

// Export PDF function with filename
export const exportGroceryListAsPDF = (groceryList: GroceryList) => {
  const doc = generateGroceryListPDF(groceryList);
  doc.save(`${groceryList.name.replace(/\s+/g, '_')}.pdf`);
};
