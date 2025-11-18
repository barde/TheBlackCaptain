#!/bin/bash

echo "🔍 Checking SHORT domains with Black Captain + Ship of Wisdom themes..."
echo ""

check_domain() {
    domain=$1
    echo -n "$domain ... "
    if nslookup "$domain" &> /dev/null; then
        echo "❌"
        return 1
    else
        echo "✅"
        return 0
    fi
}

# SHORT domains focused on: Black Captain + Ship + Wisdom + Treasure + Seekers
domains=(
    # Black + Core themes (4-12 chars)
    "blackship.com"
    "blackgems.com"
    "blackvessel.com"
    "blackquest.com"
    "blacktrove.com"
    "blackhoard.com"

    # Ship + Wisdom/Treasure
    "wisdomship.com"
    "treasureship.com"
    "seekership.com"
    "questship.com"

    # Wisdom + Treasure combos
    "wisdomtrove.com"
    "wisdomhoard.com"
    "wisdomquest.com"
    "wisdomgems.com"

    # Seeker themes
    "wisdomseeker.com"
    "gemseeker.com"
    "questseeker.com"

    # Captain + themes
    "captainsgems.com"
    "captainstrove.com"
    "captainsquest.com"

    # Vessel alternatives
    "questvessel.com"
    "gemvessel.com"
    "trovevessel.com"

    # Creative short combos
    "gemsofwisdom.com"
    "shipofgems.com"
    "blackseekers.com"
    "treasuredgems.com"
    "questforwisdom.com"
)

available=()

for domain in "${domains[@]}"; do
    if check_domain "$domain"; then
        available+=("$domain")
    fi
    sleep 0.3
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ AVAILABLE:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
for d in "${available[@]}"; do
    echo "   $d"
done
echo ""
echo "Total available: ${#available[@]} / ${#domains[@]}"
