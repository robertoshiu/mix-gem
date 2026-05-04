'use client';

import { Upload } from 'lucide-react';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { makeS2F49, makeS2F50 } from '@/lib/secs-message-log';

export default function RecipesPage() {
  const { recipes, activeRecipeId, addEvent, equipmentState } = useMesSpcStore();

  function handlePush(recipeId: string) {
    addEvent(makeS2F49(recipeId));
    // Simulate equipment ACK after 500ms
    setTimeout(() => {
      const ok = equipmentState !== 'inhibited';
      addEvent(makeS2F50(ok));
    }, 500);
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">Recipe Manager</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;
          return (
            <div
              key={recipe.id}
              className={`bg-[#111D2E] rounded border p-4 space-y-3 ${
                isActive ? 'border-[#2563EB] border-l-2' : 'border-[#1E3A5F]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#F1F5F9] font-['Fira_Code',monospace] text-sm">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{recipe.process}</p>
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold text-[#2563EB] bg-blue-900/30 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-[#94A3B8]">Chamber</div>
                <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.chamber}</div>
                {recipe.exposure > 0 && (
                  <>
                    <div className="text-[#94A3B8]">Exposure</div>
                    <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.exposure} mJ/cm²</div>
                  </>
                )}
                <div className="text-[#94A3B8]">Focus</div>
                <div className="text-[#F1F5F9] font-['Fira_Code',monospace]">{recipe.focus} nm</div>
              </div>

              <button
                type="button"
                onClick={() => handlePush(recipe.id)}
                disabled={equipmentState === 'inhibited'}
                className="w-full min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-semibold bg-[#182840] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-[#F1F5F9] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Push Recipe"
              >
                <Upload className="w-4 h-4" />
                Push Recipe
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#475569]">
        Push Recipe sends a S2F49 command to the equipment. S2F50 ACK appears in the SPC event log.
        {equipmentState === 'inhibited' && (
          <span className="text-[#EF4444] ml-2">Equipment inhibited — acknowledge SPC violation first.</span>
        )}
      </p>
    </div>
  );
}