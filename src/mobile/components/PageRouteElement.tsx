import type { PageRoute } from '@/mobile/route';
import React, { lazy, type ComponentType, type LazyExoticComponent } from 'react';

// route.file 形如 './pages/...'(相对 src/mobile/)。本文件位于 src/mobile/components/,
// 故 glob 与查找都要多一层 '../' 指向真正的路由页面目录 src/mobile/pages。
const pageModules = import.meta.glob('../pages/**/*.tsx');
const pageComponentCache = new Map<string, LazyExoticComponent<ComponentType>>();

function getPageComponent(route: PageRoute) {
  const cacheKey = `${route.file}:${route.component}`;
  const cached = pageComponentCache.get(cacheKey);
  if (cached) return cached;

  const Component = lazy(async () => {
    const moduleKey = `../${route.file.slice(2)}.tsx`;
    const loadModule = pageModules[moduleKey];
    if (!loadModule) throw new Error(`Missing page module: ${moduleKey}`);
    const module = (await loadModule()) as Record<string, ComponentType>;
    const PageComponent = module[route.component];
    if (!PageComponent) throw new Error(`Missing page component: ${route.component}`);
    return { default: PageComponent };
  });

  pageComponentCache.set(cacheKey, Component);
  return Component;
}

export function PageRouteElement({ route }: { route: PageRoute }) {
  const Component = getPageComponent(route);
  return <Component />;
}
