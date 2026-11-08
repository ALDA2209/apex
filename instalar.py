import os
import re


def leer(ruta):
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def guardar(ruta, s):
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(s)


def paso(nombre, ruta, aplicar):
    if not os.path.exists(ruta):
        print("[FALTA]        " + nombre + " -> no existe " + ruta)
        return
    s = leer(ruta)
    nuevo, estado = aplicar(s)
    if nuevo != s:
        guardar(ruta, nuevo)
    print("[" + estado.ljust(12) + "] " + nombre)


def kart(s):
    if 'estado.fase !== "libre"' in s:
        return s, "ya estaba"
    viejo = "const tecla = (e: KeyboardEvent) => {"
    if viejo not in s:
        return s, "NO ENCONTRE"
    nuevo = viejo + '\n      if (estado.fase !== "libre") return;'
    return s.replace(viejo, nuevo, 1), "listo"



def kart2(s):
    a = 'if (estado.fase !== "libre") return;'
    if a in s:
        s = s.replace(a, 'if (estado.fase !== "libre" || !estado.activo) return;', 1)
        return s, "listo"
    if "!estado.activo) return;" in s:
        return s, "ya estaba"
    return s, "NO ENCONTRE"


def kart3(s):
    if "useRef(estado.velocidad)" in s:
        return s, "ya estaba"
    if "const vel = useRef(1);" not in s:
        return s, "NO ENCONTRE"
    return s.replace("const vel = useRef(1);", "const vel = useRef(estado.velocidad);", 1), "listo"


def corto(s):
    if "distancia: 250" in s:
        return s, "ya estaba"
    if "distancia: 420" not in s:
        return s, "NO ENCONTRE"
    return s.replace("distancia: 420", "distancia: 250", 1), "listo"


def escena(s):
    cambios = 0
    if "components/Puente" not in s:
        lineas = s.split("\n")
        lineas.insert(1, 'import Puente from "@/components/Puente";')
        s = "\n".join(lineas)
        cambios += 1
    if "<Puente" not in s:
        s2 = re.sub(r"<Entorno\s*/>", "<Entorno />\n        <Puente />", s, count=1)
        if s2 == s:
            return s, "NO ENCONTRE"
        s = s2
        cambios += 1
    return s, ("listo" if cambios else "ya estaba")


def juego(s):
    if "components/Capa" in s:
        return s, "ya estaba"
    a = 'import Marcador from "@/components/Marcador";'
    b = "<Marcador />"
    if a not in s or b not in s:
        return s, "NO ENCONTRE"
    s = s.replace(a, a + '\nimport Capa from "@/components/Capa";', 1)
    s = s.replace(b, b + "\n      <Capa />", 1)
    return s, "listo"


paso("Kart.tsx: no cambiar de carril durante el control", "components/Kart.tsx", kart)
paso("Kart.tsx: quieto hasta que empiece la carrera", "components/Kart.tsx", kart2)
paso("Kart.tsx: arrancar con la velocidad del juego", "components/Kart.tsx", kart3)
paso("puentes.ts: camino mas corto al primer puente", "lib/puentes.ts", corto)
paso("Escena.tsx: agregar el puente a la pista", "components/Escena.tsx", escena)
print("")
print("Ahora corre:  npx tsc --noEmit")
