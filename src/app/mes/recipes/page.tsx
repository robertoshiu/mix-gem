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
      <h2 className="text-lg font-semibold text-[var(--smartfactory-text-primary)]">Recipe Manager</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const isActive = recipe.id === activeRecipeId;
          return (
            <div
              key={recipe.id}
              className={`bg-[var(--smartfactory-surface-card)] rounded border p-4 space-y-3 ${
                isActive ? 'border-[var(--smartfactory-border-active)] border-l-2' : 'border-[var(--smartfactory-border-default)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace] text-sm">
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-[var(--smartfactory-text-secondary)] mt-0.5">{recipe.process}</p>
                </div>
                {isActive && (
                  <span className="text-[10px] font-semibold text-[var(--smartfactory-border-active)] bg-blue-900/30 px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="text-[var(--smartfactory-text-secondary)]">Chamber</div>
                <div className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace]">{recipe.chamber}</div>
                {recipe.exposure > 0 && (
                  <>
                    <div className="text-[var(--smartfactory-text-secondary)]">Exposure</div>
                    <div className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace]">{recipe.exposure} mJ/cm²</div>
                  </>
                )}
                <div className="text-[var(--smartfactory-text-secondary)]">Focus</div>
                <div className="text-[var(--smartfactory-text-primary)] font-['Fira_Code',monospace]">{recipe.focus} nm</div>
              </div>

              <button
                type="button"
                onClick={() => handlePush(recipe.id)}
                disabled={equipmentState === 'inhibited'}
                className="w-full min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded text-sm font-semibold bg-[var(--smartfactory-surface-elevated)] hover:bg-[var(--smartfactory-border-default)] border border-[var(--smartfactory-border-default)] text-[var(--smartfactory-text-primary)] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Push Recipe"
              >
                <Upload className="w-4 h-4" />
                Push Recipe
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[var(--smartfactory-text-muted)]">
        Push Recipe sends a S2F49 command to the equipment. S2F50 ACK appears in the SPC event log.
        {equipmentState === 'inhibited' && (
          <span className="text-[var(--smartfactory-status-red)] ml-2">Equipment inhibited — acknowledge SPC violation first.</span>
        )}
      </p>
    </div>
  );
}